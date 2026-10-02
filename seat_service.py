from flask import Flask, jsonify, request, render_template_string
import time
import json
import os
import socket
import webbrowser
from threading import Timer

app = Flask(__name__)

DATA_FILE = "seats_data.json"

def get_local_ip():
    """Lấy IP máy tính để mở trên điện thoại cùng Wi-Fi"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

def init_or_load_seats(reset_all=False):
    """Khởi tạo 2.000 ghế - Sắp xếp theo đúng thứ tự Hàng (A-T) và Số (1-100)"""
    if os.path.exists(DATA_FILE) and not reset_all:
        try:
            with open(DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass

    seats = {}
    rows = [chr(i) for i in range(ord('A'), ord('T') + 1)] # A -> T (20 hàng)
    
    for row in rows:
        for num in range(1, 101): # 100 ghế/hàng = 2.000 ghế
            seat_id = f"{row}{num}"
            seats[seat_id] = {
                "seat_id": seat_id,
                "row": row,
                "number": num,
                "status": "AVAILABLE" # Tất cả ghế ban đầu TRỐNG
            }
            
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(seats, f, ensure_ascii=False, indent=2)
        
    return seats

# API Query Trạng thái Ghế
@app.route('/api/seats', methods=['GET'])
def get_seat_status():
    show_id = request.args.get('show_id', 'SHOW_123')
    
    if show_id == "SHOW_UNINITIALIZED":
        return jsonify({
            "success": False,
            "message": "Suất diễn chưa mở bán sơ đồ ghế.",
            "data": []
        }), 400

    start_time = time.time()
    seats_dict = init_or_load_seats()
    seats_list = list(seats_dict.values())
    execution_time = round(time.time() - start_time, 4)

    return jsonify({
        "success": True,
        "show_id": show_id,
        "total_seats": len(seats_list),
        "execution_time_seconds": execution_time,
        "data": seats_list
    }), 200

# API Giữ / Đặt NHIỀU GHẾ cùng lúc
@app.route('/api/seats/hold', methods=['POST'])
def hold_seats():
    data = request.get_json() or {}
    seat_ids = data.get("seat_ids", []) # Nhận danh sách nhiều ghế
    action = data.get("action", "HOLD") # HOLD hoặc BOOK
    seats_dict = init_or_load_seats()
    
    if not seat_ids:
        return jsonify({"success": False, "message": "Chưa chọn ghế nào"}), 400

    new_status = "HELD" if action == "HOLD" else "BOOKED"
    updated_seats = []
    
    for seat_id in seat_ids:
        if seat_id in seats_dict and seats_dict[seat_id]["status"] == "AVAILABLE":
            seats_dict[seat_id]["status"] = new_status
            updated_seats.append(seat_id)
            
    if updated_seats:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(seats_dict, f, ensure_ascii=False, indent=2)
        total_price = len(updated_seats) * 50000
        action_text = "chiếm giữ" if action == "HOLD" else "đặt"
        return jsonify({
            "success": True, 
            "message": f"Đã {action_text} thành công {len(updated_seats)} ghế ({', '.join(updated_seats)}) - Tổng tiền: {total_price:,} VNĐ!"
        })
    else:
        return jsonify({"success": False, "message": "Các ghế đã chọn không hợp lệ hoặc đã được người khác đặt."}), 400

# API Reset lại tất cả ghế
@app.route('/api/seats/reset', methods=['POST'])
def reset_seats():
    init_or_load_seats(reset_all=True)
    return jsonify({"success": True, "message": "Đã làm trống lại tất cả 2.000 ghế!"})


HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, user-scalable=yes">
    <title>Sơ Đồ Chọn Ghế Phim - 2.000 Ghế</title>
    <style>
        * { box-sizing: border-box; touch-action: manipulation; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #fdf2f4; color: #333; margin: 0; padding: 0; padding-bottom: 110px; }
        
        .app-header { background: #fff0f3; border-bottom: 1px solid #fecdd3; padding: 12px 15px; display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
        .app-header h1 { font-size: 1.1rem; margin: 0; color: #991b1b; font-weight: 700; }

        .time-info { text-align: center; font-size: 0.8rem; color: #666; margin: 8px 0; }
        .time-info b { color: #e11d48; }

        .screen-container { text-align: center; margin: 15px auto 10px auto; width: 90%; max-width: 600px; }
        .screen-arc { height: 12px; border-top: 3px solid #f43f5e; border-radius: 50% 50% 0 0 / 100% 100% 0 0; margin-bottom: 4px; }
        .screen-text { font-size: 0.75rem; color: #999; letter-spacing: 4px; font-weight: 600; text-transform: uppercase; }

        .container-wrapper { overflow: auto; -webkit-overflow-scrolling: touch; padding: 15px; background: #ffffff; margin: 10px auto; max-width: 100%; border-top: 1px solid #ffe4e6; border-bottom: 1px solid #ffe4e6; max-height: 62vh; }
        
        .theater-table { display: table; border-collapse: separate; border-spacing: 4px; margin: 0 auto; min-width: 3300px; }
        .theater-row { display: table-row; }
        
        .row-header { display: table-cell; vertical-align: middle; font-weight: bold; color: #888; padding: 2px 6px; font-size: 11px; text-align: center; min-width: 30px; position: sticky; left: 0; background: #fff; z-index: 10; }
        .col-header { display: table-cell; text-align: center; font-weight: bold; color: #aaa; font-size: 9px; padding-bottom: 6px; min-width: 30px; }
        
        .seat-cell { display: table-cell; width: 30px; height: 30px; border-radius: 6px; font-size: 8px; text-align: center; vertical-align: middle; cursor: pointer; user-select: none; font-weight: 600; transition: all 0.1s; }
        .seat-cell:active { transform: scale(1.25); }

        /* MÀU TRẠNG THÁI THEO THỨ TỰ SẮP XẾP CHUẨN */
        .bg-available { background: #ede9fe; color: #6d28d9; border: 1px solid #ddd6fe; } /* Ghế Trống */
        .bg-selected { background: #0284c7 !important; color: #fff !important; border: 1px solid #0369a1 !important; transform: scale(1.1); font-weight: bold; } /* Đang Chọn */
        .bg-held { background: #fef08a; color: #854d0e; border: 1px solid #fde047; font-weight: bold; } /* Đang Giữ (Vàng) */
        .bg-booked { background: #b91c1c; color: #fff; border: 1px solid #991b1b; cursor: not-allowed; opacity: 0.9; } /* Đã Bán (Đỏ) */

        .bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; border-top: 1px solid #fecdd3; padding: 10px 15px; box-shadow: 0 -2px 10px rgba(0,0,0,0.08); z-index: 99; }
        .legend-bar { display: flex; justify-content: center; align-items: center; gap: 15px; font-size: 0.75rem; color: #444; margin-bottom: 8px; }
        .legend-box { width: 14px; height: 14px; border-radius: 3px; display: inline-block; vertical-align: middle; }

        .booking-info-bar { display: flex; justify-content: space-between; align-items: center; max-width: 900px; margin: 0 auto; background: #fff1f2; padding: 10px 15px; border-radius: 8px; border: 1px solid #ffe4e6; }
        .price-text { font-size: 1.05rem; color: #be123c; font-weight: bold; }
        .btn-confirm { background: #e11d48; color: #fff; border: none; padding: 9px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 0.85rem; }
        .btn-confirm:disabled { background: #ccc; cursor: not-allowed; }

        .error-card { background: #fff; border: 1px solid #fca5a5; color: #991b1b; padding: 30px 20px; border-radius: 12px; max-width: 450px; margin: 50px auto; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
    </style>
</head>
<body>

    <div class="app-header">
        <span onclick="history.back()" style="cursor:pointer; font-weight:bold;">←</span>
        <h1>RẠP PHIM - CHỌN GHẾ GIÁ 50K</h1>
        <button onclick="resetAllSeats()" style="font-size: 0.7rem; background:#71717a; color:#fff; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Làm trống ghế</button>
    </div>

    {% if not success %}
        <div class="error-card">
            <h3>⚠️ THÔNG BÁO</h3>
            <p style="font-size: 1rem; font-weight: 600; color: #333;">{{ message }}</p>
            <p style="font-size: 0.85rem; color: #666;">Suất diễn chưa mở bán. Vui lòng quay lại sau.</p>
        </div>
    {% else %}
        <div class="time-info">
            Suất: <b>{{ show_id }}</b> | Tổng ghế: <b>{{ total_seats }}</b> | Thời gian tải: <b style="color:#16a34a;">{{ execution_time }}s (&lt; 2s)</b>
        </div>

        <div class="screen-container">
            <div class="screen-arc"></div>
            <div class="screen-text">MÀN HÌNH</div>
        </div>

        <div class="container-wrapper">
            <div class="theater-table">
                <div class="theater-row">
                    <div class="row-header" style="background:transparent;"></div>
                    {% for col_num in range(1, 101) %}
                        <div class="col-header">{{ col_num }}</div>
                    {% endfor %}
                </div>

                <!-- Hiển thị 20 Hàng (A -> T) được sắp xếp thứ tự chuẩn xác -->
                {% for row_label in rows %}
                    <div class="theater-row">
                        <div class="row-header">{{ row_label }}</div>
                        
                        {% for col_num in range(1, 101) %}
                            {% set seat_id = row_label ~ col_num %}
                            {% set seat = seats_dict[seat_id] %}
                            
                            {% if seat.status == 'AVAILABLE' %}
                                <div id="seat-{{ seat_id }}" class="seat-cell bg-available" onclick="toggleSelectSeat('{{ seat_id }}')" title="Ghế {{ seat_id }} - 50.000 VNĐ">
                                    {{ seat_id }}
                                </div>
                            {% elif seat.status == 'HELD' %}
                                <div class="seat-cell bg-held" title="Ghế {{ seat_id }} - Đang chiếm giữ">
                                    🔒{{ seat_id }}
                                </div>
                            {% else %}
                                <div class="seat-cell bg-booked" title="Ghế {{ seat_id }} - Đã đặt">
                                    🎬{{ seat_id }}
                                </div>
                            {% endif %}
                        {% endfor %}
                    </div>
                {% endfor %}
            </div>
        </div>

        <!-- Thanh Trạng Thái & Cộng Tiền Nhiều Ghế -->
        <div class="bottom-bar">
            <!-- Sắp xếp chú thích theo thứ tự chuẩn: Trống -> Chiếm giữ -> Đã đặt -->
            <div class="legend-bar">
                <div><span class="legend-box bg-available"></span> 1. Ghế trống (AVAILABLE)</div>
                <div><span class="legend-box bg-held"></span> 2. Chiếm giữ (HELD)</div>
                <div><span class="legend-box bg-booked"></span> 3. Đã đặt (BOOKED)</div>
            </div>

            <div class="booking-info-bar">
                <div>
                    <div style="font-size:0.75rem; color:#666;">Ghế chọn (<b id="selected-count">0</b>): <b id="selected-seat-name" style="color:#0284c7;">Chưa chọn</b></div>
                    <div class="price-text" id="total-price-text">TỔNG: 0 VNĐ</div>
                </div>
                <div style="display:flex; gap:8px;">
                    <button id="btn-hold" class="btn-confirm" style="background:#eab308; color:#000;" disabled onclick="confirmBooking('HOLD')">Chiếm giữ</button>
                    <button id="btn-book" class="btn-confirm" disabled onclick="confirmBooking('BOOK')">Đặt ghế (Đỏ)</button>
                </div>
            </div>
        </div>
    {% endif %}

    <script>
        // Mảng chứa nhiều ghế được chọn cùng lúc
        let selectedSeats = [];
        const PRICE_PER_SEAT = 50000; // Giá 50.000 VNĐ / ghế

        function toggleSelectSeat(seatId) {
            const index = selectedSeats.indexOf(seatId);
            
            if (index > -1) {
                // Nếu đã chọn rồi -> Bỏ chọn
                selectedSeats.splice(index, 1);
                document.getElementById('seat-' + seatId).classList.remove('bg-selected');
            } else {
                // Nếu chưa chọn -> Thêm vào danh sách chọn
                selectedSeats.push(seatId);
                document.getElementById('seat-' + seatId).classList.add('bg-selected');
            }
            
            updateUI();
        }

        function updateUI() {
            const countElem = document.getElementById('selected-count');
            const nameElem = document.getElementById('selected-seat-name');
            const priceElem = document.getElementById('total-price-text');
            const btnHold = document.getElementById('btn-hold');
            const btnBook = document.getElementById('btn-book');

            if (selectedSeats.length > 0) {
                // Sắp xếp lại danh sách ghế chọn theo thứ tự A->Z và số 1->100
                selectedSeats.sort((a, b) => {
                    let rA = a.charAt(0), rB = b.charAt(0);
                    let nA = parseInt(a.slice(1)), nB = parseInt(b.slice(1));
                    return rA === rB ? nA - nB : rA.localeCompare(rB);
                });

                countElem.innerText = selectedSeats.length;
                nameElem.innerText = selectedSeats.join(', ');
                
                // Tính cộng dồn tổng tiền
                const totalPrice = selectedSeats.length * PRICE_PER_SEAT;
                priceElem.innerText = "TỔNG: " + totalPrice.toLocaleString('vi-VN') + " VNĐ";
                
                btnHold.disabled = false;
                btnBook.disabled = false;
            } else {
                countElem.innerText = "0";
                nameElem.innerText = "Chưa chọn";
                priceElem.innerText = "TỔNG: 0 VNĐ";
                btnHold.disabled = true;
                btnBook.disabled = true;
            }
        }

        function confirmBooking(action) {
            if (selectedSeats.length === 0) return;
            
            const totalPrice = selectedSeats.length * PRICE_PER_SEAT;
            const actionName = action === 'HOLD' ? 'CHIẾM GIỮ (Màu vàng)' : 'ĐẶT BÁN (Màu đỏ)';
            
            if (confirm("Xác nhận " + actionName + " " + selectedSeats.length + " ghế (" + selectedSeats.join(', ') + ") với TỔNG TIỀN: " + totalPrice.toLocaleString('vi-VN') + " VNĐ?")) {
                fetch('/api/seats/hold', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ seat_ids: selectedSeats, action: action })
                })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        alert(data.message);
                        window.location.reload();
                    } else {
                        alert(data.message);
                    }
                });
            }
        }

        function resetAllSeats() {
            if (confirm("Xác nhận đưa tất cả 2.000 ghế về trạng thái TRỐNG ban đầu?")) {
                fetch('/api/seats/reset', { method: 'POST' })
                .then(res => res.json())
                .then(data => {
                    alert(data.message);
                    window.location.reload();
                });
            }
        }
    </script>
</body>
</html>
"""

@app.route('/', methods=['GET'])
def view_web_ui():
    show_id = request.args.get('show_id', 'SHOW_123')
    
    if show_id == "SHOW_UNINITIALIZED":
        return render_template_string(HTML_TEMPLATE, success=False, message="Suất diễn chưa mở bán sơ đồ ghế.")

    start_time = time.time()
    seats_dict = init_or_load_seats()
    rows = [chr(i) for i in range(ord('A'), ord('T') + 1)]
    execution_time = round(time.time() - start_time, 4)

    return render_template_string(
        HTML_TEMPLATE, 
        success=True,
        seats_dict=seats_dict, 
        rows=rows,
        show_id=show_id, 
        total_seats=len(seats_dict),
        execution_time=execution_time
    )

def open_browser():
    webbrowser.open_new('http://127.0.0.1:5000/')

if __name__ == '__main__':
    local_ip = get_local_ip()
    print("\n" + "="*60)
    print("🚀 DỰ ÁN CẶP/NHIỀU GHẾ - CỘNG TIỀN VÀ SẮP XẾP CHUẨN XÁC")
    print(f"👉 Link Máy tính  : http://127.0.0.1:5000/")
    print(f"📱 Link Điện thoại : http://{local_ip}:5000/")
    print("="*60 + "\n")
    
    Timer(1.5, open_browser).start()
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
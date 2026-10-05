"""Build a dependency-free, editable DOCX with deterministic OOXML geometry."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from xml.sax.saxutils import escape
from collections import Counter
import json
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'HealthAI_TestCases.docx'
GROUPS = []

def group(code, title, source, data):
    cases = []
    for i, line in enumerate(data.strip().splitlines(), 1):
        values = line.split('|')
        assert len(values) == 5, (code, i, values)
        summary, pre, steps, expected, note = values
        cases.append(dict(id=f'{code}-{i:03}', summary=summary, pre=pre,
                          steps=steps.split(' > '), expected=expected, note=note,
                          source=source, group=title))
    GROUPS.append((code, title, cases))

group('UIA', 'UI — Tài khoản và phiên demo', 'UI/src/pages/Auth.tsx; UI/src/context/HealthSession.tsx; UI/src/components/AppLayout.tsx', '''
Chặn trang riêng khi chưa đăng nhập|UI chạy; xóa phiên demo.|Mở trực tiếp /profile, /sensors, /health-tracking, /weather-ai và /.|Mỗi đường dẫn chuyển về /auth; chưa hiển thị hồ sơ.|P1; UI demo, không phải xác thực BE.
Đường dẫn đăng nhập cũ|Chưa có phiên đăng nhập.|Mở /login > Quan sát URL và biểu mẫu.|Chuyển về /auth và hiển thị biểu mẫu tài khoản.|P2.
Đăng ký và hoàn tất hồ sơ demo|UI chạy; dùng bộ hồ sơ A ở phần dữ liệu.|Chọn Đăng ký, nhập email và hai mật khẩu giống nhau > Điền hồ sơ A rồi hoàn tất.|Vào tổng quan; có hồ sơ và một mốc cân nặng ban đầu; thông báo bản trải nghiệm vẫn rõ.|P1; không tạo tài khoản PostgreSQL.
Email trống hoặc sai định dạng|Đang ở bước tài khoản.|Lần lượt nhập email trống, abc, abc@ > Điền mật khẩu hợp lệ và gửi.|Biểu mẫu chặn gửi; chưa sang bước hồ sơ.|P1; chạy riêng từng giá trị.
Mật khẩu dưới 8 ký tự|Đang ở bước tài khoản.|Nhập email hợp lệ và mật khẩu 7 ký tự > Gửi biểu mẫu.|Ràng buộc trình duyệt chặn gửi.|P1; UI áp dụng cả chế độ login demo.
Mật khẩu xác nhận không khớp|Chế độ đăng ký.|Nhập hai mật khẩu khác nhau, mỗi chuỗi ít nhất 8 ký tự > Gửi.|Hiện lỗi xác nhận; vẫn ở bước tài khoản.|P1.
Ẩn và hiện mật khẩu|Có mật khẩu đã nhập.|Nhấn nút hiện > Nhấn nút ẩn.|Đổi kiểu hiển thị; nội dung giữ nguyên; aria-label và aria-pressed tương ứng.|P2.
Họ tên toàn khoảng trắng|Đang ở bước hồ sơ.|Nhập họ tên chỉ gồm khoảng trắng và các trường khác hợp lệ > Hoàn tất.|Hiện yêu cầu nhập họ tên; không tạo hồ sơ.|P1.
Biên tuổi, chiều cao và cân nặng UI|Đang ở bước hồ sơ; các trường còn lại hợp lệ.|Thử tuổi 17/18/120/121, cao 99/100/250/251, nặng 19/20/300/301 > Gửi riêng mỗi bộ.|Chấp nhận biên trong miền; chặn giá trị ngoài miền.|P1; tuổi nguyên; cao/nặng step 0,1.
Các lựa chọn giới tính, hoạt động và mục tiêu|Đang ở bước hồ sơ.|Lần lượt chọn male/female/other; 5 mức hoạt động; maintain/lose/gain/fitness > Hoàn tất và xem /profile.|Nhãn hiển thị khớp lựa chọn, không hiện undefined.|P2; đổi bộ hồ sơ mới cho mỗi lượt.
Đăng nhập lại trong cùng tab|Đã tạo hồ sơ A rồi đăng xuất.|Nhập email A với chữ hoa và mật khẩu đủ 8 ký tự > Gửi.|Đăng nhập demo theo email, trả về tổng quan.|P1; mật khẩu không được kiểm tra với BE ở phiên bản này.
Email chưa có hồ sơ demo|Chưa có hồ sơ khớp email.|Nhập email mới và mật khẩu hợp lệ > Gửi ở chế độ login.|Chuyển sang bước thiết lập hồ sơ; không báo đã xác thực tài khoản BE.|P2; hành vi demo hiện tại.
Reload và dữ liệu phiên|Đã có hồ sơ và một số đo mô phỏng.|Tải lại trang trong cùng tab > Xem hồ sơ và số đo.|Hồ sơ/lịch cân được khôi phục từ sessionStorage; số đo mô phỏng bị xóa.|P1.
Phiên lưu bị hỏng hoặc storage bị chặn|Có thể sửa/chặn sessionStorage trong môi trường test.|Đặt dữ liệu JSON hỏng rồi reload > Chặn ghi storage rồi tạo hồ sơ.|JSON hỏng tạo phiên mới; lỗi ghi hiện cảnh báo; ứng dụng không vỡ.|P2; khôi phục cài đặt sau test.
Đăng xuất xóa trạng thái đo|Đang đăng nhập và đã có số đo.|Đăng xuất > Thử mở trang riêng > Đăng nhập lại bằng email A.|Chuyển /auth; trạng thái số đo/pending/invalid được xóa; hồ sơ demo vẫn có thể dùng lại.|P1; không đồng nghĩa thu hồi JWT BE.
Không lưu mật khẩu vào phiên demo|Đăng ký hồ sơ bằng mật khẩu nhận diện được.|Kiểm tra sessionStorage sau đăng ký > Tìm mật khẩu trong dữ liệu lưu.|Không có mật khẩu/confirmPassword trong dữ liệu phiên.|P1; chỉ kiểm tra môi trường thử nghiệm.
''')

group('UIH', 'UI — Tổng quan, BMI, lịch cân và giao diện', 'UI/src/pages/Dashboard.tsx; UI/src/pages/Profile.tsx; UI/src/pages/HealthTracking.tsx; UI/src/lib/healthProfile.ts; UI/src/components/WeeklyCheckIn.tsx', '''
Hiển thị hồ sơ cá nhân|Có hồ sơ A trong phiên demo.|Mở /profile > Đối chiếu tên, email, tuổi, giới tính, chiều cao, cân nặng và mục tiêu.|Tất cả trường khớp hồ sơ; đơn vị cm/kg rõ ràng; BMI dùng cân gần nhất.|P1.
Tính BMI theo công thức|Hồ sơ cao 170 cm, nặng 70 kg.|Mở tổng quan và hồ sơ > So sánh BMI với 70 / 1,7².|Giá trị xấp xỉ 24,22; cùng cách làm tròn giữa các thẻ.|P1; không đánh đồng BMI với kết luận sức khỏe.
Phân loại BMI tại các biên|Gọi calculateBmi bằng bộ dữ liệu test.|Tạo BMI 18,49/18,5/24,99/25/29,99/30 > Kiểm tra status.|Lần lượt underweight/normal/normal/overweight/overweight/obese.|P1; kiểm tra hàm để tránh ảnh hưởng làm tròn UI.
Lịch cân ban đầu|Vừa hoàn tất hồ sơ demo.|Mở /health-tracking > Kiểm tra lịch sử và thời điểm cân tiếp.|Có một mốc cân ban đầu; thời điểm tiếp theo bằng mốc cuối + 7 ngày.|P1.
Chặn cân trước hạn|Mốc cân cuối mới được tạo.|Thử cập nhật cân nặng 65 kg trước hạn > Xem hồ sơ/lịch sử.|Không lưu thêm mốc; cân nặng hồ sơ không thay đổi; trạng thái chờ đến hạn rõ.|P1.
Cho phép cân đúng hạn|Đặt mốc cuối cách hiện tại đúng 7 ngày bằng đồng hồ test.|Gửi cân nặng 65 kg > Xem hồ sơ, BMI và lịch sử.|Lưu đúng một mốc mới; hồ sơ là 65 kg; lịch tiếp theo +7 ngày.|P1; dùng fake clock/fixture, không đổi giờ hệ thống.
Cân nặng sai hoặc ngoài miền|Đã đến hạn cân.|Thử rỗng, chữ, 19,9, 300,1 > Gửi từng giá trị.|Chặn dữ liệu sai; không thêm lịch cân.|P1.
Biên cân nặng hợp lệ|Đã đến hạn; hồ sơ độc lập cho mỗi lượt.|Lưu 20 kg rồi thử 300 kg trên hồ sơ khác > Xem lịch sử.|Hai biên đều được chấp nhận bởi contract UI; BMI tính từ chiều cao hồ sơ.|P2.
Lịch sử cân và biểu đồ|Có ít nhất 3 mốc cân hợp lệ.|Mở /health-tracking > Đối chiếu ngày, cân nặng, BMI và thứ tự.|Biểu đồ/bảng khớp các mốc lưu; không tạo lịch sử giả của người dùng.|P1.
Điều hướng tất cả trang|Đã đăng nhập demo.|Chọn Tổng quan, Theo dõi, Thiết bị, Thời tiết và Hồ sơ > Dùng Back/Forward.|Trang, tiêu đề và mục menu tương ứng; không có trang trắng.|P2.
Menu trên màn hình nhỏ|Đã đăng nhập; viewport 390×844.|Mở menu > Chọn một trang > Đóng/mở menu lần nữa.|Nút thao tác được; trang chính không bị che sau chọn; nội dung đọc được.|P2; kiểm tra trên Chrome và Edge.
Khả năng đọc và thao tác bàn phím|Viewport 390×844 và 1440×900.|Duyệt Tab/Shift+Tab, Enter; dùng liên kết đến nội dung chính > Quan sát trường dài và biểu đồ.|Có focus; nhãn trường đọc được; không chồng chữ hoặc tràn trang; skip link đến main.|P2; tiêu chí nghiệm thu giao diện, cần thực thi.
''')

group('UIS', 'UI — Đo mô phỏng và gợi ý theo quy tắc', 'UI/src/pages/Sensors.tsx; UI/src/context/Measurement.tsx; UI/src/components/AIRecommendation.tsx; UI/src/pages/WeatherAI.tsx', '''
Kết nối mô phỏng|Mở /sensors, trạng thái chưa kết nối.|Nhấn kết nối mô phỏng > Đợi khoảng 1 giây.|Chuyển từ Đang kết nối sang Chờ đặt ngón tay; nhãn chưa kết nối phần cứng rõ.|P1.
Đo kịch bản standard|Đã kết nối demo; chọn standard; tín hiệu tốt.|Bắt đầu đo > Theo dõi thanh tiến trình trong khoảng 10 giây.|Hoàn tất với 76 BPM và SpO₂ 98%; có thời điểm đo; số liệu ghi là mẫu.|P1.
Đo kịch bản high|Đã kết nối demo; chọn high; tín hiệu tốt.|Bắt đầu và đợi hoàn tất > Xem gợi ý.|Kết quả 115 BPM, SpO₂ 98%; ưu tiên xác minh lại và không khuyến nghị bài tập chung.|P1.
Đo kịch bản oxygen|Đã kết nối demo; chọn oxygen; tín hiệu tốt.|Bắt đầu và đợi hoàn tất > Xem gợi ý và bối cảnh.|Kết quả 76 BPM, SpO₂ 92%; ẩn gợi ý vận động; không kết luận bệnh.|P1.
Tín hiệu không đạt|Bật lựa chọn tín hiệu kém.|Đo đến hết tiến trình > Xem thẻ kết quả và gợi ý.|Chuyển Cần đo lại; reading null, invalid true; không dùng số cũ làm kết quả mới.|P1.
Đo lại sau lỗi|Vừa có trạng thái Cần đo lại.|Tắt tín hiệu kém > Bắt đầu đo mới đến hoàn tất.|Xóa invalid; tạo số đo mới và thời điểm mới.|P1.
Rời trang khi đang đo|Đo đang tiến hành.|Đi sang /profile > Đợi quá 10 giây > Quay lại trang đo.|Timer cũ được hủy; pending được bỏ; không phát sinh kết quả từ phiên đã rời.|P1.
Chưa có số đo hoặc đang chờ|Phiên demo mới.|Xem gợi ý trước khi đo > Bắt đầu đo rồi xem gợi ý khi pending.|Trước đo yêu cầu bổ sung số đo; khi chờ không diễn giải như đã có kết quả.|P1.
Bối cảnh chưa biết, nghỉ và vận động|Số đo standard còn mới.|Xem trạng thái unknown > Chọn Đang nghỉ > Chọn Vừa vận động.|unknown yêu cầu bối cảnh; nghỉ có kế hoạch theo mục tiêu; vận động có hướng dẫn theo dõi hồi phục.|P1.
Số đo hết độ mới|Có reading vừa hoàn tất; dùng đồng hồ test.|Kiểm tra tại 14 phút 59 giây > Tiến đến 15 phút > Xem gợi ý.|Trước hạn còn mới; từ 15 phút stale, yêu cầu đo lại và ẩn gợi ý hoạt động.|P1; đây là cài đặt ứng dụng.
Gợi ý theo 4 mục tiêu|Số đo standard, resting, còn mới.|Lần lượt dùng hồ sơ maintain/lose/gain/fitness > Xem kế hoạch.|Nội dung theo mục tiêu đã chọn; không suy ra kết quả tăng/giảm cân từ một lần đo.|P2.
Thời tiết demo và khuyến nghị trong nhà|Mở /weather-ai; số đo standard/resting còn mới.|Quan sát nguồn dữ liệu mẫu và các chỉ số > Xem khuyến nghị tương ứng nhiệt độ 36°C, UV 8.|Có nhãn dữ liệu mẫu; gợi ý ưu tiên trong nhà và kiểm tra thời tiết thực tế.|P1; trang này chưa gọi API weather BE.
''')

group('AUT', 'BE — Đăng ký, đăng nhập và bảo vệ phiên', 'BE/src/modules/auth/; BE/test/api.test.ts; BE/src/modules/profile/schemas.ts', '''
Đăng ký hợp lệ|BE và DB test chạy; email A chưa tồn tại.|POST /auth/register với bộ A > GET /auth/me bằng accessToken trả về.|201; có JWT, expiresAt, hồ sơ và một mốc cân; /me 200; không trả password/hash.|P1; mọi API nhóm này có tiền tố /api/v1.
Email trùng không phân biệt hoa thường|Đã đăng ký email A.|Đăng ký lại email A viết hoa và có khoảng trắng ngoài.|409; không tạo thêm user hoặc mốc cân.|P1.
Email và mật khẩu đăng ký sai|DB test chạy.|Thử email sai, password 7 ký tự và 129 ký tự với các trường khác hợp lệ.|422 cho từng bộ; không tạo dữ liệu.|P1; email tối đa 320 ký tự.
Biên mật khẩu đăng ký|Dùng email mới cho mỗi bộ.|Đăng ký với password 8 và 128 ký tự > Đăng nhập bằng mật khẩu đó.|201 rồi 200; xác thực đúng chuỗi đã nhập.|P2.
Biên hồ sơ BE|Bộ A hợp lệ, thay riêng từng trường.|Thử tuổi 17/18/120/121; cao 99/100/250/251; nặng 19/20/300/301.|Biên trong miền được nhận; ngoài miền 422; dữ liệu lỗi không lưu.|P1.
Enum, trường thừa và tuổi thập phân|Dùng bộ A.|Thay gender/activityLevel/healthGoal bằng mã lạ; age=18,5; thêm userId > POST register từng bộ.|422; không nhận danh tính tự gán hoặc enum lạ.|P1.
Đăng nhập hợp lệ và chuẩn hóa email|Đã có tài khoản A.|POST /auth/login bằng email A viết hoa có khoảng trắng ngoài và đúng password.|200; token mới hợp lệ; dữ liệu đúng người A.|P1.
Sai mật khẩu và tài khoản không tồn tại|Có tài khoản A.|Gửi mật khẩu sai cho A > Gửi email chưa đăng ký.|Cả hai 401 với thông báo chung; không tiết lộ email nào tồn tại.|P1.
Thiếu token trên API riêng|BE chạy.|GET /profile, /weights, /dashboard, /devices, /measurements, /recommendations, /activity/2026-10-04 và /weather không token.|401 với WWW-Authenticate: Bearer trước khi đọc dữ liệu riêng.|P1; lặp thêm các method ghi ở từng module.
JWT bị sửa hoặc ký sai|Có JWT A và fixture token test.|Thay payload nhưng giữ chữ ký > Gửi token ký bằng khóa khác.|401 dù có bản ghi hash phiên trong fixture; không đọc dữ liệu.|P1.
JWT sai issuer, audience hoặc thuật toán|Tạo token test có session hash tương ứng.|Gửi lần lượt sai iss, aud và thuật toán HS384.|401 cho mọi token; chỉ contract HS256 đúng issuer/audience được nhận.|P1; fixture trong BE/test/api.test.ts.
JWT hết hạn hoặc phiên bị hết hạn|Có token A.|Dùng token exp đã qua > Dùng token chưa hết exp nhưng expires_at trong DB đã qua.|401 cho cả hai.|P1; sử dụng fixture DB/clock.
Đăng xuất thu hồi token|Có token A còn hiệu lực.|POST /auth/logout > GET /auth/me bằng cùng token.|204 khi logout; /me sau đó 401.|P1.
Hash mật khẩu có salt riêng|Môi trường kiểm thử service.|Hash cùng mật khẩu hai lần > Verify đúng/sai password và hash hỏng.|Hai hash khác nhau; đúng true, sai/hỏng false; không lưu plaintext.|P1.
Giới hạn đăng ký/đăng nhập|IP test riêng; reset cửa sổ limiter.|Gửi quá 30 request register/login trong 15 phút.|Các request vượt hạn 429 với thông báo phù hợp.|P2; limiter dùng chung hai route.
''')

group('PRO', 'BE — Hồ sơ, cân nặng, BMI và tổng quan', 'BE/src/modules/profile/; BE/src/modules/weights/; BE/src/modules/dashboard/; BE/test/api.test.ts', '''
Đọc và cập nhật hồ sơ|Token A hợp lệ.|GET /profile > PUT /profile với đủ trường hợp lệ, đổi fullName/heightCm > GET lại.|200; trường mới được lưu cho A; email và cân nặng giữ theo luồng riêng.|P1.
Chặn đổi cân nặng qua hồ sơ|Có token A.|PUT /profile chứa weightKg hoặc email hoặc trường thừa > Đọc hồ sơ.|422; không bypass lịch cân, không đổi dữ liệu.|P1.
Đọc lịch cân và hạn tiếp theo|A vừa đăng ký.|GET /weights.|200; một mốc ban đầu; nextCheckInAt tương ứng +7 ngày.|P1.
Cập nhật cân trước hạn|A chưa đến next_check_in.|POST /weights với weight=65 > GET /weights.|409 có nextCheckInAt; lịch sử không tăng và hồ sơ không đổi.|P1.
Cập nhật cân đúng hoặc sau hạn|Fixture đặt next_check_in bằng hoặc trước now.|POST /weights weight=65 > GET /profile và /weights.|201; thêm một mốc; hồ sơ 65 kg; hạn mới +7 ngày.|P1.
Hai request cân đồng thời|A đã đến hạn.|Gửi đồng thời weight=64 và weight=65 > Đọc hồ sơ/lịch cân.|Một 201 và một 409; chỉ một mốc mới; cân hồ sơ khớp mốc thắng.|P1; kiểm tra tính nguyên tử.
Validation cân nặng BE|Có token A và đã đến hạn.|POST weight với -1, 19,9, 300,1, chuỗi số, null hoặc trường thừa.|422; không tạo mốc cân.|P1; schema yêu cầu số 20–300 kg.
BMI lịch sử không bị viết lại|A có mốc cân ở cao 172 cm.|Đổi chiều cao thành 180 bằng PUT /profile > GET /dashboard.|BMI hiện tại dùng cao 180; BMI các mốc cũ giữ giá trị đã lưu.|P1.
Tổng quan khi chưa có phiên đo|A mới đăng ký.|GET /dashboard.|200; đúng hồ sơ/lịch cân/BMI; measurement null; gợi ý yêu cầu bổ sung phép đo.|P1.
Tổng quan dùng phiên mới nhất|A có phiên cũ completed và phiên mới pending.|GET /dashboard và /measurements/latest.|Cả hai chọn phiên mới nhất; gợi ý phản ánh pending, không dùng phiên cũ.|P1.
Phân cách dữ liệu hai người|A và B có dữ liệu khác nhau.|Đọc /profile, /weights, /dashboard bằng token A rồi B.|Mỗi người chỉ nhận dữ liệu của mình.|P1.
''')

group('MEA', 'BE — Vòng đời phiên đo', 'BE/src/modules/measurements/; BE/src/constants.ts; BE/test/api.test.ts', '''
Tạo và đọc phiên mô phỏng|Token A hợp lệ.|POST /measurements {source:simulation} > GET /measurements/{id}.|201 rồi 200; pending; số đo null; source simulation.|P1.
Validation nguồn đo và UUID|Token A hợp lệ.|Tạo source lạ, device thiếu deviceId, UUID sai hoặc simulation thêm deviceId.|422; không tạo phiên lỗi.|P1.
Hoàn tất các kịch bản mô phỏng|Tạo phiên riêng cho mỗi kịch bản.|POST /measurements/{id}/simulate với standard/high/oxygen.|200 completed; standard=76/98, high=115/98, oxygen=76/92; scenario đúng.|P1.
Phiên mô phỏng không hợp lệ|Có pending simulation.|POST simulate {valid:false} > GET phiên.|200 invalid; heartRate và spo2 null.|P1.
Không hoàn tất lại phiên đã đóng|Có phiên completed.|POST simulate lần nữa > POST cancel.|409 cho cả hai; số đo lưu ban đầu giữ nguyên.|P1.
Hủy phiên đang chờ|Có pending chưa quá hạn.|POST /measurements/{id}/cancel > POST simulate cùng id.|200 cancelled rồi 409; không sinh số đo.|P1.
Hết hạn tại 5 phút|Phiên pending; fake clock/DB fixture.|Đọc tại 4:59 rồi tại 5:00 > Thử simulate/cancel từ 5:00.|Trước hạn pending; từ hạn expired; thao tác kết thúc 409.|P1.
Số đo cũ tại 15 phút|Có completed và measured_at kiểm soát được.|Đọc phiên tại 14:59 và 15:00 sau measured_at.|stale false rồi true; thời điểm gốc không thay đổi.|P1.
Lưu bối cảnh sau hoàn tất|Có completed thuộc A.|PATCH /measurements/{id}/context với unknown/resting/exercise.|200; context lưu đúng; nhịp tim, SpO₂ và measuredAt không bị đổi.|P1.
Chặn bối cảnh sai hoặc phiên chưa hoàn tất|Có pending/invalid/cancelled và completed.|PATCH context hợp lệ vào phiên chưa completed > PATCH mã context lạ vào completed.|Phiên chưa hợp lệ 409; context lạ 422.|P1.
Danh sách và phân trang|A có nhiều phiên; B cũng có dữ liệu.|GET /measurements?limit=1&offset=1 > Thử limit=0/201 và offset=-1.|Trang đúng thứ tự mới trước, chỉ dữ liệu A; query sai 422.|P2.
Chặn truy cập phiên người khác|A có phiên; B có token.|B GET/simulate/cancel/context theo id A > Dùng UUID chưa tồn tại.|404; không đọc hoặc sửa phiên A.|P1.
Hai kết quả đến đồng thời|Có pending simulation chưa hết hạn.|Gửi hai request simulate đồng thời > Đọc phiên.|Chỉ một lần kết thúc thành công; request còn lại 409; không ghi đè kết quả.|P1; dùng DB test.
''')

group('IOT', 'BE — Thiết bị và tiếp nhận dữ liệu IoT', 'BE/src/modules/devices/; BE/src/constants.ts; BE/test/api.test.ts', '''
Đăng ký thiết bị và khóa một lần|A có token.|POST /devices {name:ESP32-test} > GET /devices.|201 có device và apiKey; danh sách không trả apiKey/key_hash.|P1; lưu khóa fixture để dùng các case tiếp.
Tên thiết bị sai|A có token.|POST tên rỗng, chỉ khoảng trắng, hơn 100 ký tự hoặc thêm trường thừa.|422; không tạo thiết bị.|P2.
Heartbeat hợp lệ|Thiết bị D của A, khóa K.|POST /iot/devices/{D}/heartbeat với X-Device-Key K, batteryPercent=85.|200 connected; pin 85; lastUpdated đổi.|P1; không cần Bearer cho IoT.
Khóa thiết bị thiếu hoặc sai|D đang enabled.|Gửi heartbeat và GET pending không khóa hoặc khóa sai.|401; không cập nhật last_seen hoặc nhận danh sách phiên.|P1.
Pin biên và ngoài miền|Khóa K hợp lệ.|Heartbeat pin 0/100, rồi -1/101/1,5 và thiếu pin.|0/100 hợp lệ; ngoài miền/phân số 422; bỏ pin mặc định 100.|P2.
Mất kết nối theo heartbeat|D enabled và last_seen kiểm soát được.|GET /devices tại 59 giây rồi 60 giây từ heartbeat.|Trước 60 giây connected; từ 60 giây disconnected.|P1.
Tạo phiên thiết bị thật qua API|D enabled thuộc A.|POST /measurements {source:device,deviceId:D} > GET IoT pending bằng K.|201 pending; danh sách có id mới, source device.|P1; có thể thử bằng request giả trước khi có phần cứng.
Danh sách pending lọc đúng|D có pending, completed và pending đã 5 phút.|GET /iot/devices/{D}/pending bằng K.|Chỉ phiên pending chưa quá 5 phút của D; tối đa 20; cũ trước.|P2.
Tiếp nhận số đo hợp lệ|D có phiên pending M.|POST /iot/devices/{D}/measurements/{M} với valid=true, heartRateBpm=78, spo2Percent=97.|200 completed, 78/97, scenario null; cập nhật last_seen.|P1.
Tiếp nhận tín hiệu không đạt|D có pending M.|Gửi {valid:false} vào M > GET phiên bằng token A.|200 invalid; các giá trị đo null.|P1.
Thiếu số đo khi valid=true|D có pending M.|Gửi chỉ valid=true; lần lượt thiếu heartRateBpm hoặc spo2Percent.|422; M vẫn pending.|P1.
Biên số đo theo schema IoT|Mới tạo một pending cho mỗi bộ.|Gửi HR 20/300 và SpO₂ 0/100 > Thử HR 19/301, SpO₂ -1/101.|Biên được nhận; ngoài miền 422.|P1; miền validation BE rộng hơn model Python.
Chống gửi lại và kết quả đến muộn|D có completed M và expired N.|Gửi kết quả lại vào M > Gửi kết quả vào N.|409; không ghi đè phép đo đã kết thúc.|P1.
Chặn dùng khóa hoặc ID chéo|A và B mỗi người có một thiết bị.|Dùng khóa D của A với ID thiết bị B > Dùng D để gửi vào phiên thiết bị B.|Sai khóa/thiết bị 401; phiên không thuộc D 404; không sửa dữ liệu B.|P1.
Không mô phỏng phiên thiết bị|A có pending source device.|POST /measurements/{id}/simulate bằng token A.|409; giữ source/deviceId và số đo null.|P1.
Thu hồi thiết bị|D enabled, có pending M.|DELETE /devices/{D} bằng A > Heartbeat bằng K > Đọc M.|204; D disabled; khóa bị từ chối 401; M cancelled.|P1.
Không dùng thiết bị bị thu hồi hoặc không sở hữu|D đã disabled; thiết bị E của B.|A tạo phiên với D > A tạo/thu hồi thiết bị E.|D 409; E 404; không sinh phiên trái quyền.|P1.
''')

group('ACT', 'BE — Hoạt động hằng ngày', 'BE/src/modules/activity/; BE/test/api.test.ts', '''
Ngày chưa có dữ liệu|A có token; chưa lưu ngày 2026-10-04.|GET /activity/2026-10-04.|200 với data null; không tạo số bước giả.|P2.
Lưu và cập nhật hoạt động|A có token.|PUT /activity/2026-10-04 với steps=4000, caloriesKcal=1200, activeMinutes=20 > PUT lại steps=5000 > GET.|200; một bản ghi cho ngày/người; giá trị cuối 5000; mặc định goal 8000/2000.|P1.
Ngày sai và năm nhuận|Token A hợp lệ.|Thử 2026-02-30, 2026-02-29, 04-10-2026 > Thử 2028-02-29.|Ngày sai 422; ngày nhuận hợp lệ được đọc/lưu.|P1.
Biên chỉ số hoạt động|Token A; ngày test riêng.|Thử steps 0/200000, activeMinutes 0/1440, calories 0/20000 > Thử vượt biên, steps phân số, goal=0.|Biên được nhận; ngoài miền/phân số không hợp lệ/goal 0 bị 422.|P1.
Upsert đồng thời và phân cách người dùng|A và B có token.|A gửi hai PUT đồng thời cùng ngày > B GET cùng ngày.|Hai PUT 200, chỉ một hàng của A; B không thấy hoạt động A.|P1.
''')

group('WEA', 'BE — Thời tiết và bộ nhớ đệm', 'BE/src/modules/weather/; BE/test/weather.test.ts; BE/test/api.test.ts', '''
Thời tiết hợp lệ|Token A; mock Open-Meteo weather và air như dữ liệu W.|GET /weather?latitude=10.8&longitude=106.6.|200; 30°C, 70%, UV 5, AQI 40; source Open-Meteo, chuẩn US AQI, nguồn và thời gian UTC rõ.|P1; dùng mock để ổn định kết quả.
Tọa độ biên và ngoài miền|Token A, mock upstream.|Thử latitude -90/90 và longitude -180/180 > Thử 90,1/180,1 hoặc chữ.|Biên được nhận; ngoài miền/không hữu hạn 422.|P1; chạy riêng từng bộ.
Phân loại trạng thái thời tiết|Mock trả các weather_code và is_day khác nhau.|Thử code 0 ngày/đêm, code 1/2/3/45/48 và code mưa.|Lần lượt sunny/clear, cloudy, rainy.|P2.
Upstream lỗi hoặc dịch vụ bị tắt|Token A.|Mock HTTP lỗi/timeout > Tắt WEATHER_ENABLED trong môi trường test > GET weather.|503 với thông báo lấy thời tiết thất bại hoặc dịch vụ tắt; không bịa dữ liệu.|P1.
Dữ liệu upstream không hợp lệ|Token A; mock thiếu current, độ ẩm 101 hoặc AQI âm.|GET weather với từng phản hồi sai.|503; không cache kết quả sai.|P1.
Cache và request đồng thời cùng vị trí|Service mới; đếm số lần mock fetch.|Gọi đồng thời 3 request cùng tọa độ > Gọi lại trước 5 phút.|Chỉ một cặp weather/air fetch; các request dùng chung dữ liệu; không fetch thêm trong TTL.|P2.
Cache hết hạn và khác tọa độ|Service dùng fake clock.|Gọi tọa độ A rồi B > Tiến đến TTL 5 phút và gọi lại A.|A/B có mục riêng; A sau TTL fetch cặp mới.|P2.
Giới hạn cache và phục hồi sau lỗi|Service maxEntries=2, mock có thể lỗi.|Gọi A/B/C rồi A > Cho D lỗi rồi thử lại khi upstream phục hồi.|Mục ít dùng bị loại; D lỗi không giữ cache; lần sau fetch lại và thành công.|P2; không lưu hồ sơ/token trong cache.
''')

group('REC', 'BE — Gợi ý theo quy tắc', 'BE/src/modules/recommendations/service.ts; BE/src/modules/recommendations/routes.ts; BE/test/domain.test.ts', '''
Gợi ý khi chưa có số đo|A chưa có measurement.|GET /recommendations.|200; yêu cầu bổ sung dữ liệu; provider=rules; không trả xác suất model.|P1.
Gợi ý pending hoặc phiên không hợp lệ|A có phiên mới nhất pending/invalid/cancelled/expired ở từng lượt.|GET /recommendations cho mỗi trạng thái.|Pending báo đang chờ; trạng thái khác yêu cầu phiên mới; không dùng phiên lỗi cho kế hoạch.|P1.
Gợi ý khi số đo đã cũ|A có completed, measured_at cách now 15 phút.|GET /recommendations.|Yêu cầu cập nhật lần đo mới; không diễn giải như dữ liệu hiện tại.|P1.
Gợi ý high/oxygen và bối cảnh standard|Dùng phiên simulation mới cho từng bộ.|GET với high/oxygen > GET standard context unknown/exercise/resting.|High/oxygen warning và ưu tiên xác minh; standard đổi nội dung theo bối cảnh.|P1.
Số đo thiết bị chưa được đưa vào model|A có completed device mới, 78/97.|GET /recommendations và /dashboard.|Báo đã ghi nhận thiết bị; nói rõ chưa triển khai model đánh giá; provider rules.|P1; không coi đây là dự đoán Python.
''')

group('CHA', 'Chat — Giao diện và Ollama cục bộ', 'UI/src/components/HealthChat.tsx; BE/src/chat-server.ts; BE/src/modules/chat/service.ts; BE/test/chat.test.ts', '''
Gửi câu hỏi và nhận trả lời|UI demo; chat server 8001; Ollama/model sẵn sàng.|Nhập câu hỏi hợp lệ > Nhấn Gửi > Đợi phản hồi.|Hiện câu hỏi và câu trả lời; hết busy; phản hồi có reply/model.|P1; endpoint /chat-api/messages, không thuộc /api/v1.
Câu hỏi rỗng và giới hạn ký tự|Chat mở; chưa busy.|Nhập toàn khoảng trắng > Thử 2000 ký tự rồi gửi API 2001 ký tự.|UI không gửi rỗng; 2000 trong giới hạn; API 2001 trả 422.|P1.
Chặn gửi trùng khi đang chờ|Mock phản hồi chậm.|Gửi câu hỏi > Nhấn Gửi/câu hỏi gợi ý nhiều lần trong busy.|Chỉ một request đang hoạt động; nút và ô nhập bị khóa phù hợp.|P1.
Lỗi dịch vụ và giữ lại câu hỏi|Dừng Ollama hoặc mock phản hồi sai/rỗng.|Gửi câu hỏi > Kiểm tra lịch sử, thông báo và draft.|Không thêm câu trả lời giả; khôi phục draft; giữ lịch sử trước lượt lỗi; cho phép thử lại.|P1.
Timeout và rời trang|Request chưa trả; có fake timer.|Tiến đến 100 giây hoặc rời trang chat.|Request bị abort; timeout giữ câu hỏi để gửi lại; unmount không cập nhật UI cũ.|P2; Ollama timeout BE 90 giây.
Hội thoại nhiều lượt|Có 10 lượt hỏi–đáp hoặc hơn.|Gửi câu hỏi tiếp > Kiểm tra payload request.|Gửi tối đa 19 message gần nhất; role xen kẽ và message cuối user; context ở lượt hiện tại.|P1.
Tạo hội thoại mới|Có ít nhất một lượt trả lời; không busy.|Nhấn Cuộc trò chuyện mới.|Lịch sử và lỗi được xóa; gợi ý câu hỏi ban đầu hiện lại.|P2.
Validation role và thứ tự chat|Chat server test chạy.|Gửi role system, hai user liên tiếp, message cuối assistant hoặc hơn 20 messages.|422; không chuyển payload sai đến Ollama.|P1.
Không gửi danh tính dư thừa cho chat|UI có hồ sơ A.|Gửi câu hỏi rồi xem payload > Gửi API thêm email vào context.|Payload UI không chứa tên/email/password/token; field thừa bị 422.|P1.
Giới hạn tốc độ và Origin|IP riêng cho test; chat server 8001.|Gửi quá 10 request trong 60 giây > Gửi từ Origin không được phép.|Vượt hạn 429; Origin lạ 403; localhost:5173 và 127.0.0.1:5173 được phép.|P2.
Prompt dùng đúng bối cảnh hiện tại|Mock fetch Ollama để kiểm tra body.|Gửi lịch sử cũ cùng context stale=true/pending=true và mục tiêu A.|Body chứa system instruction, lịch sử và context mới; stream=false; không thêm kết quả Python.|P1; có thể kiểm thử tự động service.
Chất lượng trả lời và không tự bịa số đo|Ollama/model thật sẵn sàng; bộ câu hỏi cố định.|Hỏi giải thích số đo mô phỏng, hỏi lại sau bổ sung bối cảnh, rồi yêu cầu chẩn đoán/kê thuốc.|Trả lời tiếng Việt, dùng bối cảnh; không hỏi lại thông tin đã có, không bịa số đo hay kê thuốc.|P1; đánh giá thủ công nhiều lượt, không coi prompt là bằng chứng đã đạt.
''')

group('AIP', 'AI Python — Dữ liệu, huấn luyện và dự đoán', 'AI/src/preprocess.py; AI/src/generate_dataset.py; AI/src/train.py; AI/src/evaluate.py; AI/src/predict.py; AI/tests/test_pipeline.py', '''
Sinh dataset đúng số mẫu và tái lập|Python AI sẵn thư viện; output vào thư mục test riêng.|Sinh 30000 mẫu seed 42 hai lần > So sánh checksum/header/số dòng.|Cùng seed cho cùng nội dung; có 12 features và health_label; đúng 30000 dòng dữ liệu.|P1; không ghi đè dataset/model đang dùng khi thực thi case.
Chặn sinh quá ít mẫu|Thư mục test riêng.|Gọi generate_dataset(records=9999).|ValueError; không tạo dataset như thể đủ điều kiện.|P2.
Nạp nhãn số và nhãn chuỗi|CSV test có đủ 3 lớp và features hợp lệ.|Nạp một CSV nhãn 0/1/2 > Nạp CSV Normal/Warning/High Risk.|Cùng mã y dạng integer; features không chứa health_label.|P1.
Dataset sai nhãn hoặc thiếu lớp|CSV test.|Thử thiếu health_label, label=3, label rỗng hoặc chỉ hai lớp.|ValueError; không huấn luyện hay xuất model từ dataset lỗi.|P1.
Tính BMI khi thiếu và giữ BMI có sẵn|Đầu vào mẫu P.|Bỏ bmi > Gọi prepare_features > Thử lại với bmi=24.|Thiếu BMI tính 70/1,7²; BMI explicit giữ 24.|P1.
Chuẩn hóa gender và thứ tự features|DataFrame có cột đảo thứ tự.|Gửi gender female/male > Kiểm tra kết quả.|Đổi thành 0/1; đầu ra theo đúng FEATURES.|P1.
Chặn features lạ và category sai|Đầu vào P.|Thêm userId/health_label; gender=other hoặc 0,5; activity_level=3 > Gọi xử lý từng bộ.|ValueError; không âm thầm bỏ trường sai.|P1; model chỉ gender 0/1 và activity 0/1/2.
Biên tất cả features Python|Dùng BOUNDS trong preprocess; mỗi lần đổi riêng một trường.|Thử hai biên từng feature > Thử thấp/cao hơn biên và infinity.|Biên hợp lệ được nhận nếu BMI tính vẫn hợp lệ; ngoài miền/infinity bị ValueError.|P1; danh sách biên trong phần dữ liệu.
Thiếu trường dự đoán bắt buộc|Đầu vào P.|Bỏ heart_rate, spo2 hoặc temperature; thử null/NaN cho trường bắt buộc.|ValueError; không trả một dự đoán giả.|P1.
Dự đoán chỉ có BMI, không có chiều cao/cân|Đầu vào P, bmi=24.|Bỏ height và weight > Gọi predict_health > Bỏ cả bmi rồi gọi lại.|Có BMI vẫn dự đoán; thiếu cả BMI và kích thước bị ValueError.|P1; height/weight được impute từ train.
Cột train hoàn toàn thiếu|CSV đủ lớp; một cột feature toàn NaN.|Gọi load_dataset.|ValueError trước cross-validation.|P1; thiếu một phần được median-impute trong pipeline.
Chia tập và tránh rò rỉ dữ liệu|CSV fixture đủ mẫu mỗi lớp; output test riêng.|Chạy train seed 42 > Kiểm tra split và các pipeline trong CV.|80/20 stratified; imputer/scaler chỉ fit trên train/fold; không fit trên toàn dataset trước chia.|P1; cần đọc pipeline và log, không dùng test để chọn model.
Chọn model bằng CV và lưu metadata|Dataset 30000 mẫu seed 42; môi trường cố định.|Train > So sánh cv_scores > Đọc bundle và training_metadata.json.|Model chọn có CV macro F1 lớn nhất; train_rows 24000/test_rows 6000; lưu seed/checksum/features/versions.|P1; không hardcode winner vì phụ thuộc dữ liệu và môi trường.
XGBoost là tùy chọn|Hai môi trường test: có và không có xgboost.|Chạy train trên cùng dataset ở mỗi môi trường.|Không có vẫn so sánh 3 model; có thì thêm XGBoost; không lỗi import tùy chọn.|P2; output riêng cho mỗi môi trường.
Định dạng và tính ổn định dự đoán|Có model hợp lệ và mẫu P.|Gọi predict_health hai lần > Kiểm tra risk_level/class/confidence.|class thuộc 0/1/2; tên nhãn tương ứng; confidence trong [0,1]; hai kết quả giống nhau.|P1; confidence không phải xác suất mắc bệnh.
Thiếu model và nạp lại khi file đổi|Bản sao model test đáng tin cậy.|Gọi model_path không tồn tại > Thay file model test hợp lệ và đổi mtime > Gọi lại.|Thiếu file báo FileNotFoundError; cache nạp lại file đã đổi.|P2; không thay model sản xuất.
Báo cáo đánh giá model|Bundle evaluation test có models và hold-out.|Chạy evaluate > Đọc CSV/JSON và kiểm tra PNG.|Có metrics từng model, confusion matrix, accuracy plot, permutation importance; số support bằng test_rows.|P1; không gán trước điểm số/importance.
Model giả lập và provenance|Model hiện tại đã train.|Đọc training_metadata và báo cáo huấn luyện > Xem đầu ra predict.|Ghi rõ synthetic; không diễn giải accuracy giả lập như accuracy cảm biến thực.|P1.
''')

group('SYS', 'Hệ thống — API, lỗi, tài liệu và dữ liệu', 'BE/src/app.ts; BE/src/server.ts; BE/src/docs.ts; BE/src/db.ts; BE/package.json; UI/package.json', '''
Health khi DB sẵn sàng và khi DB lỗi|BE test chạy với DB test.|GET /health khi DB có kết nối > Mô phỏng DB không khả dụng rồi gọi lại.|200 có status/database/runtime/orm; khi DB lỗi trả 503, không báo healthy.|P1; nếu lỗi lúc khởi động thì server từ chối chạy.
Swagger và OpenAPI|BE chạy.|GET /docs và /openapi.json > Đối chiếu routes và auth scheme.|Tài liệu mở được, JSON hợp lệ; endpoint/payload/xác thực khớp code; ghi bug nếu lệch.|P2.
Endpoint không tồn tại|BE chạy.|GET /duong-dan-khong-ton-tai.|404 JSON detail; không lộ stacktrace.|P2.
JSON hỏng và body quá lớn|BE test chạy.|POST /api/v1/auth/login body JSON hỏng > Gửi body vượt 32 KB.|400 cho JSON hỏng; 413 cho body quá lớn.|P1; chat có giới hạn riêng 48 KB.
CORS và header bảo vệ|BE chạy với allowlist test.|OPTIONS từ localhost:5173 > OPTIONS từ Origin lạ > GET một endpoint.|Origin hợp lệ có allow-origin; Origin lạ không có; không lộ x-powered-by; có header Helmet.|P2; CORS không thay thế xác thực.
Lỗi nội bộ không lộ thông tin|Mock lỗi DB/API không dự kiến.|Gọi route gặp lỗi > Quan sát response/log.|500 với thông báo chung; không trả connection string, JWT secret hoặc stacktrace.|P1; không ghi secret thật vào bằng chứng.
Khởi động lại giữ dữ liệu BE|DB test có tài khoản/mốc cân/số đo.|Khởi động lại BE > Đăng nhập và đọc lại dữ liệu.|Dữ liệu PostgreSQL còn; không bị đổi thành dữ liệu mock.|P1.
Build và kiểm tra tự động|Có môi trường test và dependency đúng.|Chạy UI build/lint; BE typecheck/build/test; AI unittest trong môi trường test.|Các lệnh thành công; ghi kết quả thực và log khi chạy; không suy ra Passed từ việc có test file.|P1; bộ test API có ghi dữ liệu, dùng DB thử riêng.
''')

group('INT', 'Tích hợp và phần cứng — Kế hoạch nghiệm thu tiếp theo', 'UI/src/context/HealthSession.tsx; UI/src/context/Measurement.tsx; BE/src/modules/devices/; AI/src/preprocess.py', '''
UI đăng ký/đăng nhập với BE thật|Chưa triển khai; cần adapter API và môi trường test.|Đăng ký qua UI > Kiểm tra user DB > Đăng xuất rồi login sai/đúng mật khẩu.|UI dùng JWT BE; login sai bị từ chối; dữ liệu thuộc tài khoản thật thay vì phiên demo.|P1; kế hoạch tích hợp, hiện chưa thể thực thi end-to-end.
UI nhận số đo từ thiết bị qua BE|Chưa nối UI với API đo; cần firmware và adapter.|UI tạo source=device > Firmware nhận pending và gửi kết quả > UI lấy cập nhật.|Số đo UI khớp bản ghi BE và source device; không thay bằng 76/98 mẫu.|P1; kế hoạch tích hợp, cần phần cứng.
Ánh xạ dữ liệu BE sang features AI|Cần thiết kế adapter và nguồn đủ 12 features.|Thử age=120, gender=other, activity very_active, HR=250 và cân nặng=20 > Đối chiếu BOUNDS Python.|Adapter có quy tắc được duyệt; từ chối miền ngoài model, không ép mã hoặc bịa đầu vào; lỗi được hiển thị rõ.|P1; BE/UI và Python có miền khác nhau; chưa triển khai.
Gọi model Python từ BE|Cần triển khai dịch vụ hoặc tiến trình dự đoán.|Gửi feature hợp lệ > Đối chiếu predict_health > Mô phỏng Python không khả dụng.|Kết quả và nhãn khớp model; lỗi dịch vụ hiển thị rõ; không dùng rules giả làm model.|P1; kế hoạch tích hợp, chưa có endpoint prediction hiện tại.
ESP32 khởi động và kết nối mạng|Chưa có phần cứng; ESP32, firmware, Wi-Fi test và khóa thiết bị cần sẵn sàng.|Cấp nguồn > Kết nối Wi-Fi > Gửi heartbeat.|Không reset lặp; BE ghi nhận thiết bị và heartbeat; khóa không xuất hiện trong log công khai.|P1; khi chạy thiếu phần cứng ghi Blocked.
MAX30102 có/ngắt tín hiệu ngón tay|Cần cảm biến và firmware có đánh giá chất lượng tín hiệu.|Đo không đặt ngón tay > Đặt ngón tay giữ yên > Rút tay giữa phiên.|Không có tín hiệu không được gửi valid=true; tín hiệu đạt mới có kết quả; tín hiệu mất báo cần đo lại.|P1; thuật toán/tiêu chí chất lượng cần xác định trước nghiệm thu.
Mất Wi-Fi và kết nối lại|Thiết bị thật đang có pending; khóa còn hiệu lực.|Ngắt mạng > Đợi heartbeat quá 60 giây > Kết nối lại và gửi kết quả nếu phiên còn hạn.|Trạng thái BE disconnected rồi connected; không nhân bản phiên; phiên quá 5 phút không được hoàn tất.|P1; kế hoạch phần cứng.
Đối chiếu độ chính xác thiết bị|Cần phần cứng, thiết bị tham chiếu và tiêu chí sai số được thống nhất.|Đo lặp cùng điều kiện bằng hai thiết bị > Ghi thời gian, chất lượng tín hiệu và sai lệch.|Báo cáo sai lệch so với tiêu chí đã duyệt; không dùng số mô phỏng làm chuẩn tham chiếu.|P1; chưa có tiêu chí nên chưa kết luận đạt/rớt.
Thu hồi khóa khi firmware vẫn gửi|Phần cứng D đang chạy, có pending.|Thu hồi D trên BE > Cho firmware tiếp tục heartbeat/gửi kết quả.|BE từ chối khóa cũ; pending bị hủy; firmware không báo đã gửi thành công.|P1; API có thể kiểm tra trước, phần firmware cần thiết bị.
''')

CASES = [case for _, _, cases in GROUPS for case in cases]
assert len({c['id'] for c in CASES}) == len(CASES)
W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
def tag(name, attrs='', content=''):
    return f'<w:{name}{attrs}>{content}</w:{name}>'
def run(text, bold=False):
    return '<w:r>' + ('<w:rPr><w:b/></w:rPr>' if bold else '') + '<w:t xml:space="preserve">' + escape(text) + '</w:t></w:r>'
def para(text='', style='Normal', keep=False, num=None):
    pr = tag('pStyle', f' w:val="{style}"')
    if keep:
        pr += '<w:keepNext/>'
    if num is not None:
        pr += f'<w:numPr><w:ilvl w:val="0"/><w:numId w:val="{num}"/></w:numPr>'
    return '<w:p><w:pPr>' + pr + '</w:pPr>' + run(text) + '</w:p>'
def pagebreak():
    return '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>'
def table(rows, widths=(2700,6660)):
    props = '<w:tblStyle w:val="TestTable"/><w:tblW w:w="9360" w:type="dxa"/><w:tblInd w:w="120" w:type="dxa"/><w:tblLayout w:type="fixed"/>'
    props += '<w:tblCellMar><w:top w:w="60" w:type="dxa"/><w:bottom w:w="60" w:type="dxa"/><w:start w:w="120" w:type="dxa"/><w:end w:w="120" w:type="dxa"/></w:tblCellMar>'
    grid = ''.join(f'<w:gridCol w:w="{v}"/>' for v in widths)
    body = ''
    for ri, row in enumerate(rows):
        cells = ''
        for ci, (text, width) in enumerate(zip(row, widths)):
            shade = '<w:shd w:fill="E8EEF5"/>' if ci == 0 else ''
            content = text if text.startswith('<w:p') else para(text, 'CaseLabel' if ci == 0 else 'CaseText')
            cells += f'<w:tc><w:tcPr><w:tcW w:w="{width}" w:type="dxa"/>{shade}<w:vAlign w:val="top"/></w:tcPr>{content}</w:tc>'
        body += '<w:tr><w:trPr><w:cantSplit/>' + ('<w:tblHeader/>' if ri == 0 else '') + '</w:trPr>' + cells + '</w:tr>'
    return '<w:tbl><w:tblPr>' + props + '</w:tblPr><w:tblGrid>' + grid + '</w:tblGrid>' + body + '</w:tbl>'

parts = []
parts += [para('HEALTHAI', 'Subtitle'), para('TÀI LIỆU TEST CASE', 'Title'), para('Kiểm thử UI · Backend · AI Python · IoT', 'Subtitle'), para('Phiên bản 1.0 | Ngày lập: 04/10/2026 | Trạng thái: Chưa thực thi')]
parts += [para('1. Mục đích và cách dùng', 'Heading1')]
parts += [para(f'Tài liệu gồm {len(CASES)} test case viết lại theo mã nguồn HealthAI hiện có. Các trường được chuyển từ mẫu doc/Yen_TestCases.xlsx sang biểu mẫu Word để dễ đọc và điền kết quả. File mẫu gốc được giữ làm tài liệu tham chiếu; trạng thái và lỗi của dự án cũ không được kế thừa.')]
parts += [para('Mỗi case giữ TC ID, TC Summary, Precondition, Steps, Expected Results, Test Results on Build 1, Test Results on Build 2, TR ID/User Story/Spec Area và Notes. TR ID dùng mã module và đường dẫn source vì chưa có danh mục requirement chính thức.')]
parts += [para('Build 1 và Build 2 mặc định Not Run; khi chạy ghi build/commit, ngày, người thực hiện, actual result và bằng chứng. Passed khi mọi kết quả mong đợi đạt; Failed khi khác mong đợi; Blocked khi thiếu điều kiện; Skipped khi có lý do được ghi. Không coi việc đọc code hoặc có test tự động là bằng chứng testcase đã Passed.')]
parts += [para('P1: luồng chính, bảo vệ dữ liệu và trạng thái đo; P2: giao diện, tùy chọn và tính ổn định. Các case gồm nhiều bộ giá trị phải chạy từng bộ, ghi kết quả riêng nếu một bộ thất bại.')]
parts += [para('2. Phạm vi theo phiên bản hiện tại', 'Heading1'), para('UI React hiện là bản demo: hồ sơ/lịch cân nằm trong sessionStorage, đăng nhập theo email demo và số đo nằm trong bộ nhớ. Trang thời tiết dùng mockWeather. UI chưa gọi API hồ sơ/đo của BE; chỉ chat gọi /chat-api/messages.'), para('BE Express + TypeScript dùng Prisma/PostgreSQL; API chính /api/v1 dùng JWT, API IoT dùng X-Device-Key. Gợi ý BE hiện provider=rules. Chat là server riêng ở 127.0.0.1:8001 gọi Ollama cục bộ.'), para('AI Python là pipeline phân loại độc lập trên dữ liệu giả lập. Chưa có dịch vụ nối model vào UI/BE/chat. Nhóm INT là kế hoạch cho các tích hợp và phần cứng chưa hoàn tất, không phải mô tả chức năng đã có.')]
parts += [pagebreak(), para('3. Môi trường và dữ liệu kiểm thử', 'Heading1'), para('Dùng database test riêng; không dùng thông tin cá nhân hoặc khóa thật. UI chạy cổng 5173, BE chính cổng 8000; chat cổng 8001, Ollama cổng 11434. Node theo BE/package.json (>=22.12); Python AI có thư viện requirements.txt. Kiểm tra UI trên Chrome/Edge ở 390×844 và 1440×900.')]
parts += [para('A — Hồ sơ: email qa-a-<mã-lượt>@example.com; password TestPass123!; fullName Nguyễn An; age 24; gender male; heightCm 172; weightKg 66.5; activityLevel moderate; healthGoal maintain. B dùng email khác và dữ liệu riêng. UI register cần confirmPassword; BE register không có trường này.')]
parts += [para('P — Features AI: age=25, gender=1, height=170, weight=70, bmi=24, heart_rate=80, spo2=98, activity_level=2, temperature=30, humidity=60, uv_index=5, aqi=50. Temperature là nhiệt độ môi trường. Dataset thêm health_label; đầu vào predict không có nhãn.')]
parts += [para('BOUNDS Python: age 18–100; gender 0–1; height 100–250; weight 25–350; bmi 10–80; heart_rate 25–240; spo2 50–100; activity_level 0–2; temperature -30–60; humidity 0–100; uv_index 0–25; aqi 0–500. Gender và activity_level chỉ nhận mã nguyên. Đây là miền dữ liệu phần mềm, không phải tiêu chuẩn y khoa.')]
parts += [para('W — Mock thời tiết: weather.current: temperature_2m=30, relative_humidity_2m=70, weather_code=0, is_day=1, time=2026-10-04T10:00; air.current: us_aqi=40, uv_index=5, time cùng mốc. Bộ nhớ đệm BE mặc định 5 phút, tối đa 100 tọa độ.')]
parts += [para('Thời gian: lịch cân 7 ngày; phiên đo BE hết hạn 5 phút; số đo hết độ mới sau 15 phút; heartbeat thiết bị hết hiệu lực sau 60 giây. Dùng fake clock hoặc fixture trong DB test cho các biên, không đổi đồng hồ máy. Mốc UI kết nối/đo mô phỏng là khoảng 1/10 giây.')]
parts += [para('Trước khi chạy: tạo A/B và token riêng cho từng case cần độc lập; tạo thiết bị D/K ở môi trường test. Sau chạy dọn đúng dữ liệu đã tạo. Các case train/evaluate dùng output riêng hoặc bản sao dự án để không ghi đè model hiện hành.')]
parts += [pagebreak(), para('4. Ma trận phạm vi', 'Heading1')]
for code, title, cases in GROUPS:
    parts += [para(f'{code}: {title} — {len(cases)} case ({cases[0]["id"]} đến {cases[-1]["id"]}).')]
parts += [para('Điều kiện kết thúc một đợt: mọi case P1 trong phạm vi đã thực thi; lỗi chặn/ưu tiên cao đã xử lý hoặc có quyết định ghi nhận; case Blocked/Skipped có lý do và người theo dõi. Chỉ ký nghiệm thu phần cứng khi có thiết bị và tiêu chí sai số đã thống nhất.')]
parts += [para('Nguồn đối chiếu: các đường dẫn code được ghi trong từng testcase; BE/test/api.test.ts, domain.test.ts, weather.test.ts, chat.test.ts và AI/tests/test_pipeline.py là nguồn cho kiểm tra tự động. Các case UI, chất lượng hội thoại và phần cứng cần bằng chứng chạy riêng.')]

num_id = 1
for code, title, cases in GROUPS:
    for start in range(0, len(cases), 2):
        parts += [pagebreak(), para(title, 'Heading1')]
        for case in cases[start:start+2]:
            parts += [para(f'{case["id"]} | {case["summary"]}', 'Heading3')]
            step_xml = ''.join(para(step, 'CaseStep', num=num_id) for step in case['steps'])
            num_id += 1
            rows = [
                ('TC ID / Summary', case['id'] + ' — ' + case['summary']),
                ('Precondition', case['pre']), ('Steps', step_xml),
                ('Expected Results', case['expected']),
                ('Build 1', 'Not Run | Actual: ____________________'),
                ('Build 2', 'Not Run | Actual: ____________________'),
                ('TR ID / Spec Area', code + ' — ' + case['source']),
                ('Notes', case['note'] + ' | Bug/Bằng chứng: __________'),
            ]
            parts += [table(rows), para('', 'Spacer')]

parts += [pagebreak(), para('5. Phiếu ghi nhận lỗi và tổng hợp đợt chạy', 'Heading1'), para('Mẫu lỗi dưới đây lấy các trường của Bug List trong file mẫu và áp dụng cho HealthAI. Không sao chép lỗi của dự án cũ hoặc tạo lỗi giả khi chưa thực thi.')]
parts += [table([(a,b) for a,b in [('Bug ID','HA-BUG-____'),('Summary','____________________'),('Description','____________________'),('Steps to Reproduce','____________________'),('Actual Result','____________________'),('Expected Result','____________________'),('Reproducible / Frequency','Always / Sometimes / Once: ____'),('Severity / Category','Critical / High / Medium / Low; UI / API / AI / IoT: ____'),('Screenshot / Log','Đường dẫn bằng chứng đã che dữ liệu nhạy cảm: ____'),('Notes / Linked TC','TC ID: ____; build: ____; người ghi: ____; ngày: ____')]])]
parts += [para('Tổng hợp ban đầu', 'Heading2'), para(f'Total test cases: {len(CASES)} | Passed: 0 | Failed: 0 | Blocked: 0 | Skipped: 0 | Not Run: {len(CASES)}. Đây là trạng thái lập tài liệu, không phải báo cáo kiểm thử đã chạy.'), para('Đợt chạy: ____ | Build/commit: ____ | Môi trường: ____ | Người thực hiện: ____ | Ngày: ____'), para('Passed: ____ | Failed: ____ | Blocked: ____ | Skipped: ____ | Not Run: ____'), para('Lỗi còn mở và quyết định nghiệm thu: _____________________________________')]

sect = '<w:sectPr><w:headerReference w:type="default" r:id="rIdHeader"/><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708"/><w:cols w:space="720"/></w:sectPr>'
document = f'<?xml version="1.0" encoding="UTF-8"?><w:document xmlns:w="{W}" xmlns:r="{R}"><w:body>' + ''.join(parts) + sect + '</w:body></w:document>'

def style(sid, size, color, before, after, line, bold=False, keep=False):
    ppr = f'<w:spacing w:before="{before}" w:after="{after}" w:line="{line}" w:lineRule="auto"/><w:jc w:val="left"/>' + ('<w:keepNext/>' if keep else '')
    if sid.startswith('Heading'):
        ppr += f'<w:outlineLvl w:val="{int(sid[-1])-1}"/>'
    rpr = f'<w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Calibri" w:cs="Calibri"/><w:sz w:val="{size}"/><w:szCs w:val="{size}"/><w:color w:val="{color}"/>' + ('<w:b/>' if bold else '')
    return f'<w:style w:type="paragraph" w:styleId="{sid}"><w:name w:val="{sid}"/><w:basedOn w:val="Normal"/>' + '<w:pPr>' + ppr + '</w:pPr><w:rPr>' + rpr + '</w:rPr></w:style>'

# compact_reference_guide. Named override CaseForm: 9.5 pt, single 1.05,
# 3 pt vertical cell padding; two form records per page, source trace 9.5 pt.
styles = f'<w:styles xmlns:w="{W}"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/></w:rPr></w:rPrDefault></w:docDefaults>'
styles += '<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:spacing w:before="0" w:after="120" w:line="300" w:lineRule="auto"/><w:widowControl/></w:pPr><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="22"/><w:color w:val="222222"/></w:rPr></w:style>'
for args in [('Title',48,'0B2545',0,160,300,True,True),('Subtitle',26,'555555',0,120,300,False,True),('Heading1',32,'2E74B5',360,200,300,True,True),('Heading2',26,'2E74B5',280,140,300,True,True),('Heading3',24,'1F4D78',200,100,300,True,True),('CaseText',19,'222222',0,0,252,False,False),('CaseLabel',19,'1F4D78',0,0,252,True,False),('CaseStep',19,'222222',0,0,252,False,False),('Spacer',4,'FFFFFF',0,0,240,False,False),('Furniture',18,'666666',0,0,240,False,False)]:
    styles += style(*args)
styles += '<w:style w:type="table" w:styleId="TestTable"><w:name w:val="TestTable"/><w:tblPr><w:tblBorders>' + ''.join(f'<w:{side} w:val="single" w:sz="4" w:color="BAC8D7"/>' for side in ['top','left','bottom','right','insideH','insideV']) + '</w:tblBorders></w:tblPr></w:style></w:styles>'
numbering = f'<w:numbering xmlns:w="{W}"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="540"/></w:tabs><w:ind w:left="540" w:hanging="270"/></w:pPr></w:lvl></w:abstractNum>'
numbering += ''.join(f'<w:num w:numId="{i}"><w:abstractNumId w:val="0"/><w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>' for i in range(1,num_id)) + '</w:numbering>'
header = f'<w:hdr xmlns:w="{W}">' + para('HEALTHAI | Test Cases v1.0 | Chưa thực thi', 'Furniture') + '</w:hdr>'
footer = f'<w:ftr xmlns:w="{W}"><w:p><w:pPr><w:pStyle w:val="Furniture"/><w:jc w:val="right"/></w:pPr>' + run('Trang ') + '<w:fldSimple w:instr="PAGE"><w:r><w:t>1</w:t></w:r></w:fldSimple></w:p></w:ftr>'
relbase = 'http://schemas.openxmlformats.org/package/2006/relationships'
rels = f'<Relationships xmlns="{relbase}">' + ''.join(f'<Relationship Id="{rid}" Type="{R}/{typ}" Target="{target}"/>' for rid,typ,target in [('rIdStyles','styles','styles.xml'),('rIdNumber','numbering','numbering.xml'),('rIdHeader','header','header1.xml'),('rIdFooter','footer','footer1.xml'),('rIdSettings','settings','settings.xml')]) + '</Relationships>'
ct = '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'
for path, typ in [('document','document.main'),('styles','styles'),('numbering','numbering'),('header1','header'),('footer1','footer'),('settings','settings')]:
    ct += f'<Override PartName="/word/{path}.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.{typ}+xml"/>'
ct += '<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>'
files = {'[Content_Types].xml':ct,'_rels/.rels':f'<Relationships xmlns="{relbase}"><Relationship Id="rId1" Type="{R}/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>', 'word/document.xml':document,'word/styles.xml':styles,'word/numbering.xml':numbering,'word/header1.xml':header,'word/footer1.xml':footer,'word/_rels/document.xml.rels':rels,'word/settings.xml':f'<w:settings xmlns:w="{W}"><w:zoom w:percent="100"/><w:defaultTabStop w:val="720"/><w:updateFields w:val="true"/><w:compat/></w:settings>','docProps/core.xml':'<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>HealthAI - Test Cases</dc:title><dc:creator>HealthAI</dc:creator><dc:description>Testcase theo template Yen_TestCases.xlsx; chưa thực thi.</dc:description></cp:coreProperties>'}
for value in files.values():
    ET.fromstring(value)
with ZipFile(OUT,'w',ZIP_DEFLATED) as z:
    for name, value in files.items():
        z.writestr(name, value.encode('utf-8'))

# Structural quality gate: table geometry, source existence, statuses, old domain.
ns={'w':W}
tree=ET.fromstring(document)
for tbl in tree.findall('.//w:tbl',ns):
    grid=[int(e.get(f'{{{W}}}w')) for e in tbl.findall('w:tblGrid/w:gridCol',ns)]
    assert sum(grid)==9360
    for row in tbl.findall('w:tr',ns):
        assert [int(e.get(f'{{{W}}}w')) for e in row.findall('w:tc/w:tcPr/w:tcW',ns)]==grid
for case in CASES:
    for path in case['source'].split('; '):
        assert (ROOT/path).exists(), path
assert document.count('Not Run | Actual:')==2*len(CASES)
assert not any(old in document for old in ['Railway','TrainTimetable','TicketPrice','PID/Passport'])
assert all(case['steps'] and case['expected'] and case['pre'] for case in CASES)
report={'cases':len(CASES),'groups':{code:len(cases) for code,_,cases in GROUPS},'not_run':len(CASES),'structural_checks':'passed','visual_qa':'not completed; LibreOffice unavailable','preset':'compact_reference_guide','override':'CaseForm: 9.5pt, line 1.05, cell top/bottom 60 DXA; label/detail widths 2700/6660 DXA','output':str(OUT)}
(Path(__file__).parent/'qa_report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(report,ensure_ascii=False,indent=2))

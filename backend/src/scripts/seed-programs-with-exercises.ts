/**
 * seed-programs-with-exercises.ts
 *
 * Chạy lệnh:  npm run seed:full
 *
 * Script này:
 *  1. Upsert tất cả bài tập cần cho 3 chương trình (beginner / intermediate / advanced)
 *  2. Nếu chương trình chưa có → seed luôn với exerciseId đã được link
 *  3. Nếu chương trình đã có  → cập nhật exerciseId cho từng bài tập trong ngày
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Exercise from '../models/Exercise';
import WorkoutProgram from '../models/WorkoutProgram';

// ---------------------------------------------------------------------------
// 1. Định nghĩa bài tập  (name phải khớp chính xác với tên trong chương trình)
// ---------------------------------------------------------------------------

const EXERCISES = [
  // ── Cardio ──────────────────────────────────────────────────────────────────
  {
    name: 'Nhảy tại chỗ',
    nameEn: 'Jumping in Place',
    category: 'cardio', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 50, imageUrl: null,
    description: 'Bài tập khởi động cardio đơn giản, tăng nhịp tim nhanh chóng.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, hai tay thả dọc người.', durationSeconds: 5 },
      { order: 2, instruction: 'Nhảy tại chỗ liên tục, giữ nhịp đều.', durationSeconds: 30 },
      { order: 3, instruction: 'Hít thở đều qua mũi, thở ra qua miệng.', durationSeconds: 15 },
    ], isActive: true,
  },
  {
    name: 'Jumping jacks',
    nameEn: 'Jumping Jacks',
    category: 'cardio', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 55, imageUrl: null,
    description: 'Nhảy dang chân đồng thời giơ tay, khởi động toàn thân.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, hai tay thả dọc người.', durationSeconds: 5 },
      { order: 2, instruction: 'Nhảy dang hai chân sang hai bên, đồng thời giơ tay lên trên đầu.', durationSeconds: 10 },
      { order: 3, instruction: 'Nhảy về tư thế ban đầu. Lặp lại liên tục.', durationSeconds: 45 },
    ], isActive: true,
  },
  {
    name: 'High knees',
    nameEn: 'High Knees',
    category: 'cardio', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 60, imageUrl: null,
    description: 'Chạy tại chỗ nâng gối cao, tăng nhịp tim và cơ đùi trước.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, hai tay giơ ngang thắt lưng.', durationSeconds: 5 },
      { order: 2, instruction: 'Chạy tại chỗ, nâng đầu gối chạm tay, đổi chân liên tục.', durationSeconds: 30 },
      { order: 3, instruction: 'Duy trì tốc độ đều, hít thở nhịp nhàng.', durationSeconds: 15 },
    ], isActive: true,
  },
  {
    name: 'Butt kicks',
    nameEn: 'Butt Kicks',
    category: 'cardio', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 55, imageUrl: null,
    description: 'Đá gót chân chạm mông khi chạy tại chỗ, tăng cường cơ đùi sau.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, hơi nghiêng người về trước.', durationSeconds: 5 },
      { order: 2, instruction: 'Đưa gót chân phải lên chạm mông, đổi sang chân trái, liên tục.', durationSeconds: 30 },
      { order: 3, instruction: 'Hít thở đều, duy trì tốc độ nhịp nhàng.', durationSeconds: 15 },
    ], isActive: true,
  },
  {
    name: 'Mountain climbers',
    nameEn: 'Mountain Climbers',
    category: 'cardio', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 70, imageUrl: null,
    description: 'Leo núi tại chỗ, tăng nhịp tim và sức mạnh lõi cơ thể.',
    steps: [
      { order: 1, instruction: 'Vào tư thế hít đất thẳng, tay thẳng dưới vai.', durationSeconds: 5 },
      { order: 2, instruction: 'Đưa đầu gối phải nhanh về phía ngực, đồng thời duỗi chân trái ra.', durationSeconds: 5 },
      { order: 3, instruction: 'Đổi chân nhanh chóng liên tục như đang leo núi.', durationSeconds: 30 },
      { order: 4, instruction: 'Giữ hông thẳng, không nâng mông lên.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Bicycle crunches',
    nameEn: 'Bicycle Crunches',
    category: 'cardio', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 45, imageUrl: null,
    description: 'Gập bụng xoay người mô phỏng đạp xe, tăng cơ bụng và cardio.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, hai tay đặt sau đầu, đầu gối co lên 90°.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng vai khỏi sàn, xoay khuỷu tay trái về phía gối phải.', durationSeconds: 10 },
      { order: 3, instruction: 'Đồng thời duỗi thẳng chân trái. Đổi bên liên tục.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Khởi động tổng hợp',
    nameEn: 'Full Body Warm-up',
    category: 'cardio', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 50, imageUrl: null,
    description: 'Tổng hợp các động tác khởi động nhẹ nhàng cho toàn thân.',
    steps: [
      { order: 1, instruction: 'Xoay cổ nhẹ nhàng 10 vòng mỗi chiều.', durationSeconds: 20 },
      { order: 2, instruction: 'Xoay vai 10 vòng về trước và sau.', durationSeconds: 20 },
      { order: 3, instruction: 'Xoay hông 10 vòng mỗi chiều.', durationSeconds: 20 },
      { order: 4, instruction: 'Nhảy tại chỗ hoặc đi bộ nhanh để tăng nhịp tim.', durationSeconds: 60 },
    ], isActive: true,
  },
  {
    name: 'Warm-up cardio',
    nameEn: 'Cardio Warm-up',
    category: 'cardio', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 50, imageUrl: null,
    description: 'Khởi động tim mạch nhẹ nhàng trước khi tập nặng.',
    steps: [
      { order: 1, instruction: 'Đi bộ nhanh tại chỗ 30 giây.', durationSeconds: 30 },
      { order: 2, instruction: 'Chuyển sang chạy bộ tại chỗ tốc độ vừa 30 giây.', durationSeconds: 30 },
      { order: 3, instruction: 'Nâng gối cao 20 giây.', durationSeconds: 20 },
      { order: 4, instruction: 'Jumping jacks 10 giây.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Jump squats',
    nameEn: 'Jump Squats',
    category: 'cardio', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 75, imageUrl: null,
    description: 'Squat có nhảy, kết hợp sức mạnh chân và tim mạch.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, chân rộng bằng vai.', durationSeconds: 5 },
      { order: 2, instruction: 'Xổm xuống đến khi đùi song song sàn.', durationSeconds: 5 },
      { order: 3, instruction: 'Nhảy mạnh lên cao, duỗi thẳng người.', durationSeconds: 5 },
      { order: 4, instruction: 'Hạ cánh mềm mại trên mũi chân. Lặp lại.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Jump rope simulation',
    nameEn: 'Jump Rope Simulation',
    category: 'cardio', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 70, imageUrl: null,
    description: 'Mô phỏng nhảy dây không cần dây, hiệu quả đốt mỡ cao.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, hai tay cầm cạnh như đang cầm dây nhảy.', durationSeconds: 5 },
      { order: 2, instruction: 'Xoay cổ tay và nhảy nhẹ liên tục trên mũi chân.', durationSeconds: 45 },
    ], isActive: true,
  },
  {
    name: 'Speed skaters',
    nameEn: 'Speed Skaters',
    category: 'cardio', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 70, imageUrl: null,
    description: 'Nhảy bên mô phỏng trượt băng, tăng sức mạnh mông và cardio.',
    steps: [
      { order: 1, instruction: 'Nhảy sang phải bằng chân phải, chân trái đưa ra sau chéo.', durationSeconds: 10 },
      { order: 2, instruction: 'Nhảy sang trái bằng chân trái, chân phải đưa ra sau chéo.', durationSeconds: 10 },
      { order: 3, instruction: 'Lặp lại liên tục, giữ tốc độ đều.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Box jumps tại chỗ',
    nameEn: 'Box Jumps in Place',
    category: 'cardio', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 80, imageUrl: null,
    description: 'Nhảy bật tại chỗ mô phỏng box jump, tăng sức nổ và cardio.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, chân rộng bằng hông.', durationSeconds: 5 },
      { order: 2, instruction: 'Xổm nhẹ, vung tay ra sau lấy đà.', durationSeconds: 5 },
      { order: 3, instruction: 'Nhảy thẳng lên cao hết cỡ, đưa đầu gối lên.', durationSeconds: 5 },
      { order: 4, instruction: 'Hạ cánh mềm mại. Lặp lại liên tục.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Mountain climbers nhanh',
    nameEn: 'Fast Mountain Climbers',
    category: 'cardio', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 80, imageUrl: null,
    description: 'Leo núi tại chỗ tốc độ cao, đốt mỡ cực kỳ hiệu quả.',
    steps: [
      { order: 1, instruction: 'Vào tư thế hít đất thẳng.', durationSeconds: 5 },
      { order: 2, instruction: 'Đổi chân liên tục ở tốc độ nhanh nhất có thể.', durationSeconds: 30 },
      { order: 3, instruction: 'Giữ hông thẳng, không để hông nhấp nhô.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Bear crawl',
    nameEn: 'Bear Crawl',
    category: 'cardio', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 60, imageUrl: null,
    description: 'Bò gấu tăng sức mạnh toàn thân và cardio.',
    steps: [
      { order: 1, instruction: 'Tư thế bốn điểm chống, nâng gối lên khỏi sàn 2–3 cm.', durationSeconds: 5 },
      { order: 2, instruction: 'Di chuyển về trước: cùng lúc đưa tay phải và chân trái.', durationSeconds: 20 },
      { order: 3, instruction: 'Bò lùi về vị trí ban đầu. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Dynamic warm-up',
    nameEn: 'Dynamic Warm-up',
    category: 'cardio', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 70, imageUrl: null,
    description: 'Khởi động động cho buổi tập cường độ cao.',
    steps: [
      { order: 1, instruction: 'Leg swings: đưa chân về trước sau 10 lần mỗi bên.', durationSeconds: 30 },
      { order: 2, instruction: 'Hip circles: xoay hông 10 vòng mỗi chiều.', durationSeconds: 20 },
      { order: 3, instruction: 'Arm crosses: vươn tay qua ngực đổi bên 10 lần.', durationSeconds: 20 },
      { order: 4, instruction: 'Jumping jacks 20 cái để nâng nhiệt.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Burpee pull-through',
    nameEn: 'Burpee Pull-Through',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 8, caloriesBurned: 120, imageUrl: null,
    description: 'Biến thể burpee nâng cao kết hợp kéo qua tay, cường độ cực cao.',
    steps: [
      { order: 1, instruction: 'Thực hiện 1 burpee tiêu chuẩn (đứng → hít đất → nhảy lên).', durationSeconds: 10 },
      { order: 2, instruction: 'Sau khi hạ xuống, đưa tay phải qua dưới người sang trái.', durationSeconds: 5 },
      { order: 3, instruction: 'Đứng dậy và nhảy lên. Lặp lại đổi tay.', durationSeconds: 5 },
    ], isActive: true,
  },
  {
    name: 'Tuck jumps',
    nameEn: 'Tuck Jumps',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 100, imageUrl: null,
    description: 'Nhảy co gối lên ngực, tăng sức nổ và nhịp tim.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, chân rộng bằng hông.', durationSeconds: 5 },
      { order: 2, instruction: 'Nhảy lên cao, đưa hai đầu gối về phía ngực càng cao càng tốt.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ xuống mềm mại, lập tức nhảy lên lần tiếp theo.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Jump lunges',
    nameEn: 'Jump Lunges',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 90, imageUrl: null,
    description: 'Lunges có nhảy đổi chân, cường độ cao đốt mỡ nhanh.',
    steps: [
      { order: 1, instruction: 'Vào tư thế lunges, chân phải trước.', durationSeconds: 5 },
      { order: 2, instruction: 'Nhảy lên đổi vị trí chân, hạ xuống vào lunges chân trái trước.', durationSeconds: 5 },
      { order: 3, instruction: 'Lặp lại liên tục, hạ cánh mềm mại.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Sprint tại chỗ',
    nameEn: 'Sprint in Place',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 110, imageUrl: null,
    description: 'Chạy nước rút tại chỗ hết sức, đốt calo tối đa.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, chuẩn bị tư thế chạy.', durationSeconds: 5 },
      { order: 2, instruction: 'Chạy cực nhanh tại chỗ trong 20 giây hết sức.', durationSeconds: 20 },
      { order: 3, instruction: 'Nghỉ 10 giây đi bộ chậm. Lặp lại.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Jump squat series',
    nameEn: 'Jump Squat Series',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 100, imageUrl: null,
    description: 'Chuỗi squat nhảy liên tục cường độ cao.',
    steps: [
      { order: 1, instruction: 'Thực hiện 5 squat nhảy liên tiếp không nghỉ.', durationSeconds: 15 },
      { order: 2, instruction: 'Nghỉ 5 giây, rồi lặp lại chuỗi.', durationSeconds: 5 },
      { order: 3, instruction: 'Giữ hạ cánh mềm, đùi song song sàn khi xổm.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Step-up với nhảy',
    nameEn: 'Step-Up with Jump',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 85, imageUrl: null,
    description: 'Bước lên bậc kết hợp nhảy, tăng sức mạnh chân và cardio.',
    steps: [
      { order: 1, instruction: 'Đứng trước bậc thang hoặc hộp cao 20–30 cm.', durationSeconds: 5 },
      { order: 2, instruction: 'Bước chân phải lên, đẩy mạnh nhảy lên cao.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ xuống, đổi chân. Lặp lại liên tục.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Complex warm-up',
    nameEn: 'Complex Warm-up',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 80, imageUrl: null,
    description: 'Khởi động phức hợp cường độ cao, chuẩn bị cho buổi tập đỉnh.',
    steps: [
      { order: 1, instruction: 'High knees 20 giây.', durationSeconds: 20 },
      { order: 2, instruction: 'Butt kicks 20 giây.', durationSeconds: 20 },
      { order: 3, instruction: 'Jumping jacks 20 giây.', durationSeconds: 20 },
      { order: 4, instruction: 'Mountain climbers 20 giây.', durationSeconds: 20 },
      { order: 5, instruction: 'Nghỉ 30 giây.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Burpee + push-up',
    nameEn: 'Burpee + Push-up',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 110, imageUrl: null,
    description: 'Burpees kết hợp hít đất ở dưới, toàn thân cường độ tối đa.',
    steps: [
      { order: 1, instruction: 'Đứng → ngồi xổm → đẩy chân ra tư thế hít đất.', durationSeconds: 5 },
      { order: 2, instruction: 'Thực hiện 1 cái hít đất.', durationSeconds: 5 },
      { order: 3, instruction: 'Kéo chân về, nhảy đứng lên vỗ tay trên đầu.', durationSeconds: 5 },
      { order: 4, instruction: 'Lặp lại liên tục.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Jump squat + lunge',
    nameEn: 'Jump Squat + Lunge',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 100, imageUrl: null,
    description: 'Kết hợp squat nhảy và lunges nhảy liên tục.',
    steps: [
      { order: 1, instruction: '1 squat nhảy, hạ xuống.', durationSeconds: 5 },
      { order: 2, instruction: 'Chuyển thẳng sang 1 jump lunge.', durationSeconds: 5 },
      { order: 3, instruction: 'Lặp lại chuỗi liên tục không nghỉ.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Mountain climber fast',
    nameEn: 'Mountain Climber Fast',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 90, imageUrl: null,
    description: 'Leo núi tốc độ tối đa, cường độ cao nhất.',
    steps: [
      { order: 1, instruction: 'Tư thế hít đất thẳng.', durationSeconds: 5 },
      { order: 2, instruction: 'Đổi chân nhanh nhất có thể trong thời gian quy định.', durationSeconds: 35 },
    ], isActive: true,
  },
  {
    name: 'Sprint final',
    nameEn: 'Final Sprint',
    category: 'cardio', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 115, imageUrl: null,
    description: 'Sprint tổng lực cuối buổi để đốt cháy hết năng lượng.',
    steps: [
      { order: 1, instruction: 'Chạy nước rút tại chỗ hết tốc lực trong 30 giây.', durationSeconds: 30 },
    ], isActive: true,
  },

  // ── Weights (body-weight) ───────────────────────────────────────────────────
  {
    name: 'Squat cơ bản',
    nameEn: 'Basic Squat',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 40, imageUrl: null,
    description: 'Squat cơ bản không tạ, tăng cường cơ đùi và mông.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, chân rộng bằng vai, mũi chân hướng hơi ra ngoài.', durationSeconds: 5 },
      { order: 2, instruction: 'Xổm xuống đến khi đùi song song sàn, lưng thẳng.', durationSeconds: 10 },
      { order: 3, instruction: 'Đứng lên, siết cơ mông ở đỉnh. Lặp lại.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Squat',
    nameEn: 'Squat',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 40, imageUrl: null,
    description: 'Squat không tạ, bài tập nền tảng cho cơ đùi và mông.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, chân rộng bằng vai.', durationSeconds: 5 },
      { order: 2, instruction: 'Xổm xuống đến khi đùi song song sàn, lưng thẳng.', durationSeconds: 10 },
      { order: 3, instruction: 'Đứng lên siết cơ mông. Lặp lại.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Gập bụng',
    nameEn: 'Sit-ups',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 35, imageUrl: null,
    description: 'Gập bụng cổ điển, tăng cường cơ bụng trên.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, gối co, hai tay chéo trước ngực hoặc sau gáy.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng thân trên lên hướng về gối.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ xuống chậm rãi. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Plank',
    nameEn: 'Plank',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 3, caloriesBurned: 30, imageUrl: null,
    description: 'Tư thế plank giữ tĩnh, tăng cường cơ lõi toàn diện.',
    steps: [
      { order: 1, instruction: 'Chống khuỷu tay xuống sàn, cẳng tay song song, chân duỗi thẳng.', durationSeconds: 10 },
      { order: 2, instruction: 'Siết cơ bụng và mông, toàn thân thành một đường thẳng.', durationSeconds: 5 },
      { order: 3, instruction: 'Giữ tư thế theo thời gian quy định, hít thở đều.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Plank dài',
    nameEn: 'Long Plank Hold',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 35, imageUrl: null,
    description: 'Plank giữ lâu hơn, thử thách sức bền cơ lõi.',
    steps: [
      { order: 1, instruction: 'Vào tư thế plank khuỷu tay.', durationSeconds: 10 },
      { order: 2, instruction: 'Giữ thẳng người, siết bụng và mông trong suốt thời gian.', durationSeconds: 45 },
    ], isActive: true,
  },
  {
    name: 'Plank variations',
    nameEn: 'Plank Variations',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 45, imageUrl: null,
    description: 'Kết hợp nhiều biến thể plank: thẳng, khuỷu, side plank.',
    steps: [
      { order: 1, instruction: 'Plank thẳng 15 giây.', durationSeconds: 15 },
      { order: 2, instruction: 'Side plank trái 15 giây.', durationSeconds: 15 },
      { order: 3, instruction: 'Side plank phải 15 giây.', durationSeconds: 15 },
    ], isActive: true,
  },
  {
    name: 'Lunges',
    nameEn: 'Lunges',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 45, imageUrl: null,
    description: 'Lunges không tạ, tăng cơ đùi và cải thiện thăng bằng.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, bước chân phải về trước.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ gối trái xuống gần sàn, đùi phải song song sàn.', durationSeconds: 10 },
      { order: 3, instruction: 'Đứng lên, đổi chân. Lặp lại.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Side lunges',
    nameEn: 'Side Lunges',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 40, imageUrl: null,
    description: 'Lunges sang bên, tăng cơ đùi trong và hông.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, bước chân phải rộng sang bên.', durationSeconds: 5 },
      { order: 2, instruction: 'Xổm xuống bên phải, chân trái duỗi thẳng.', durationSeconds: 10 },
      { order: 3, instruction: 'Đứng lên, đổi sang bên trái. Lặp lại.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Reverse lunges',
    nameEn: 'Reverse Lunges',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 50, imageUrl: null,
    description: 'Lunges ngược, an toàn hơn cho đầu gối.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, bước chân phải ra sau.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ gối phải xuống gần sàn, đùi trái song song sàn.', durationSeconds: 10 },
      { order: 3, instruction: 'Đứng lên, đổi chân. Lặp lại.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Calf raises',
    nameEn: 'Calf Raises',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 3, caloriesBurned: 25, imageUrl: null,
    description: 'Kiễng chân tăng cường cơ bắp chân.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, hai tay có thể vịn tường để thăng bằng.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng gót chân lên cao hết cỡ, siết cơ bắp chân.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ xuống chậm rãi. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Wall sit',
    nameEn: 'Wall Sit',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 3, caloriesBurned: 30, imageUrl: null,
    description: 'Ngồi tường, bài tập giữ tĩnh tăng cường cơ đùi.',
    steps: [
      { order: 1, instruction: 'Tựa lưng vào tường, xổm xuống đến khi đùi song song sàn.', durationSeconds: 10 },
      { order: 2, instruction: 'Giữ tư thế, gối vuông góc, lưng áp tường.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Push-ups cơ bản',
    nameEn: 'Basic Push-ups',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 45, imageUrl: null,
    description: 'Hít đất cơ bản, tăng cường ngực, vai và tay sau.',
    steps: [
      { order: 1, instruction: 'Nằm sấp, tay rộng hơn vai một chút.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ ngực xuống gần sàn, khuỷu tay hơi cong ra sau.', durationSeconds: 5 },
      { order: 3, instruction: 'Đẩy người lên. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Push-ups',
    nameEn: 'Push-ups',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 45, imageUrl: null,
    description: 'Hít đất tiêu chuẩn, bài tập kinh điển cho phần trên cơ thể.',
    steps: [
      { order: 1, instruction: 'Nằm sấp, tay rộng bằng vai.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ ngực xuống gần sàn.', durationSeconds: 5 },
      { order: 3, instruction: 'Đẩy người lên. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Push-ups nâng cao',
    nameEn: 'Advanced Push-ups',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 55, imageUrl: null,
    description: 'Hít đất nâng cao với biên độ rộng hơn và tốc độ chậm hơn.',
    steps: [
      { order: 1, instruction: 'Tư thế hít đất, tay rộng hơn vai.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ xuống chậm 3 giây, đẩy lên 1 giây.', durationSeconds: 10 },
      { order: 3, instruction: 'Siết ngực ở đỉnh. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Wide push-ups',
    nameEn: 'Wide Push-ups',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 50, imageUrl: null,
    description: 'Hít đất tay rộng, tập trung cơ ngực nhiều hơn.',
    steps: [
      { order: 1, instruction: 'Tư thế hít đất, tay rộng hơn vai gấp đôi.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ ngực xuống, khuỷu tay mở rộng ra hai bên.', durationSeconds: 10 },
      { order: 3, instruction: 'Đẩy lên. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Diamond push-ups',
    nameEn: 'Diamond Push-ups',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 55, imageUrl: null,
    description: 'Hít đất tay kim cương, tập trung cơ tay sau (tricep).',
    steps: [
      { order: 1, instruction: 'Tư thế hít đất, hai tay tạo hình kim cương (ngón cái và trỏ chạm nhau).', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ ngực xuống chạm tay.', durationSeconds: 10 },
      { order: 3, instruction: 'Đẩy lên. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Pike push-ups',
    nameEn: 'Pike Push-ups',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 50, imageUrl: null,
    description: 'Hít đất tư thế góc chữ V, tập trung cơ vai.',
    steps: [
      { order: 1, instruction: 'Tư thế hít đất, nâng hông lên tạo hình chữ V ngược.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ đầu xuống về phía sàn giữa hai tay.', durationSeconds: 10 },
      { order: 3, instruction: 'Đẩy lên. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Superman',
    nameEn: 'Superman',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 35, imageUrl: null,
    description: 'Nằm sấp nâng tay chân, tăng cường cơ lưng dưới.',
    steps: [
      { order: 1, instruction: 'Nằm sấp, hai tay duỗi thẳng phía trước đầu.', durationSeconds: 5 },
      { order: 2, instruction: 'Đồng thời nâng tay và chân lên khỏi sàn càng cao càng tốt.', durationSeconds: 10 },
      { order: 3, instruction: 'Giữ 2 giây, hạ xuống. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Shoulder taps',
    nameEn: 'Shoulder Taps',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 35, imageUrl: null,
    description: 'Từ tư thế hít đất, chạm vai xen kẽ — tăng ổn định lõi.',
    steps: [
      { order: 1, instruction: 'Vào tư thế hít đất thẳng tay.', durationSeconds: 5 },
      { order: 2, instruction: 'Tay phải chạm vai trái, trở về. Tay trái chạm vai phải, trở về.', durationSeconds: 10 },
      { order: 3, instruction: 'Giữ hông không lắc. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Arm circles',
    nameEn: 'Arm Circles',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 3, caloriesBurned: 20, imageUrl: null,
    description: 'Xoay tay tròn khởi động vai và cải thiện linh hoạt.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, giơ hai tay ngang vai.', durationSeconds: 5 },
      { order: 2, instruction: 'Xoay tay tròn nhỏ về phía trước 15 lần.', durationSeconds: 15 },
      { order: 3, instruction: 'Đổi chiều xoay ngược 15 lần.', durationSeconds: 15 },
    ], isActive: true,
  },
  {
    name: 'Crunches',
    nameEn: 'Crunches',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 35, imageUrl: null,
    description: 'Gập bụng ngắn, tập trung cơ bụng trên chính xác hơn sit-up.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, gối co, tay đặt sau tai.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng đầu và vai khỏi sàn, cằm hướng về gối.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ xuống chậm. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Leg raises',
    nameEn: 'Leg Raises',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 40, imageUrl: null,
    description: 'Nâng chân nằm ngửa, tăng cơ bụng dưới.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, tay đặt dưới mông hoặc dọc người.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng hai chân thẳng lên đến 90°.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ chân xuống chậm, không chạm sàn. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Russian twists',
    nameEn: 'Russian Twists',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 40, imageUrl: null,
    description: 'Xoay thân ngồi nghiêng, tăng cơ bụng nghiêng và lõi.',
    steps: [
      { order: 1, instruction: 'Ngồi, gối co, lưng nghiêng 45°, tay chắp trước ngực.', durationSeconds: 5 },
      { order: 2, instruction: 'Xoay thân sang phải chạm sàn bên phải.', durationSeconds: 5 },
      { order: 3, instruction: 'Xoay sang trái chạm sàn bên trái. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Glute bridge',
    nameEn: 'Glute Bridge',
    category: 'weights', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 40, imageUrl: null,
    description: 'Cầu mông, tăng cơ mông và lưng dưới.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, gối co, bàn chân đặt gần mông.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng hông lên cao, siết cơ mông ở đỉnh.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ hông xuống chậm. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Plank shoulder tap',
    nameEn: 'Plank Shoulder Tap',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 40, imageUrl: null,
    description: 'Chạm vai trong tư thế plank, tăng ổn định lõi và vai.',
    steps: [
      { order: 1, instruction: 'Tư thế plank thẳng tay.', durationSeconds: 5 },
      { order: 2, instruction: 'Tay phải chạm vai trái, trở về. Tay trái chạm vai phải.', durationSeconds: 10 },
      { order: 3, instruction: 'Giữ hông ổn định, không lắc. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Side plank',
    nameEn: 'Side Plank',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 35, imageUrl: null,
    description: 'Plank nghiêng, tăng cơ bụng nghiêng và hông.',
    steps: [
      { order: 1, instruction: 'Nằm nghiêng, chống khuỷu tay, chân xếp lên nhau.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng hông lên tạo đường thẳng từ đầu đến chân.', durationSeconds: 5 },
      { order: 3, instruction: 'Giữ theo thời gian quy định. Đổi bên.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Squat pulse',
    nameEn: 'Squat Pulse',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 50, imageUrl: null,
    description: 'Squat rung nhẹ ở vị trí thấp, đốt cháy cơ đùi.',
    steps: [
      { order: 1, instruction: 'Xổm xuống tư thế squat thấp.', durationSeconds: 5 },
      { order: 2, instruction: 'Rung nhẹ lên xuống vài cm trong 30 giây.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Inchworm',
    nameEn: 'Inchworm',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 55, imageUrl: null,
    description: 'Di chuyển như con sâu đo, tăng linh hoạt và sức mạnh toàn thân.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, cúi xuống chạm tay sàn.', durationSeconds: 10 },
      { order: 2, instruction: 'Đi tay ra phía trước đến tư thế hít đất.', durationSeconds: 10 },
      { order: 3, instruction: 'Đi tay ngược về, đứng thẳng. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Bulgarian split squat',
    nameEn: 'Bulgarian Split Squat',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 8, caloriesBurned: 70, imageUrl: null,
    description: 'Squat chân sau đặt lên bề mặt cao, tập trung đùi và mông.',
    steps: [
      { order: 1, instruction: 'Đứng trước ghế, đặt mu bàn chân phải lên ghế phía sau.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ gối phải xuống gần sàn, giữ thân thẳng.', durationSeconds: 10 },
      { order: 3, instruction: 'Đứng lên. Lặp lại và đổi chân.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Push-ups + rotation',
    nameEn: 'Push-ups with Rotation',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 55, imageUrl: null,
    description: 'Hít đất kết hợp xoay người sang bên, tập ngực và lõi.',
    steps: [
      { order: 1, instruction: 'Thực hiện 1 cái hít đất.', durationSeconds: 5 },
      { order: 2, instruction: 'Khi đẩy lên, xoay người sang phải giơ tay phải lên trần.', durationSeconds: 5 },
      { order: 3, instruction: 'Trở về, hít đất, xoay sang trái. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Glute bridge march',
    nameEn: 'Glute Bridge March',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 45, imageUrl: null,
    description: 'Cầu mông nâng chân xen kẽ, tăng cường mông và lõi.',
    steps: [
      { order: 1, instruction: 'Vào tư thế glute bridge, nâng hông lên cao.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng chân phải lên, giữ hông thẳng.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ xuống, nâng chân trái. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Dead bug',
    nameEn: 'Dead Bug',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 40, imageUrl: null,
    description: 'Bài tập ổn định lõi nâng cao, phối hợp tay chân ngược chiều.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, tay duỗi thẳng lên trần, gối co 90°.', durationSeconds: 5 },
      { order: 2, instruction: 'Duỗi tay phải và chân trái ra sàn đồng thời, lưng dính sàn.', durationSeconds: 10 },
      { order: 3, instruction: 'Kéo về, đổi bên. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Plyo push-ups',
    nameEn: 'Plyometric Push-ups',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 80, imageUrl: null,
    description: 'Hít đất nổ lực có nhảy, tăng sức mạnh ngực và tốc độ.',
    steps: [
      { order: 1, instruction: 'Tư thế hít đất.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ xuống, đẩy mạnh bật lên khỏi sàn.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ cánh mềm, lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'V-ups',
    nameEn: 'V-Ups',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 70, imageUrl: null,
    description: 'Nâng tay chân cùng lúc tạo hình chữ V, tăng cơ bụng sâu.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, tay duỗi thẳng qua đầu, chân thẳng.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng đồng thời tay và chân gặp nhau ở giữa.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ xuống chậm. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Archer push-ups',
    nameEn: 'Archer Push-ups',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 8, caloriesBurned: 80, imageUrl: null,
    description: 'Hít đất kiểu cung thủ, tiến gần đến one-arm push-up.',
    steps: [
      { order: 1, instruction: 'Tư thế hít đất, tay rất rộng.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ người về phía tay phải, tay trái duỗi thẳng.', durationSeconds: 10 },
      { order: 3, instruction: 'Đẩy lên, đổi sang bên trái. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Pike push-ups nâng',
    nameEn: 'Elevated Pike Push-ups',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 65, imageUrl: null,
    description: 'Pike push-up với chân đặt lên bề mặt cao, tăng tải vai.',
    steps: [
      { order: 1, instruction: 'Tư thế pike push-up với chân đặt trên ghế.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ đầu xuống gần sàn giữa hai tay.', durationSeconds: 10 },
      { order: 3, instruction: 'Đẩy lên. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Staggered push-ups',
    nameEn: 'Staggered Push-ups',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 70, imageUrl: null,
    description: 'Hít đất tay so le, cải thiện sự mất cân bằng và tăng lực.',
    steps: [
      { order: 1, instruction: 'Tư thế hít đất, một tay đặt cao hơn tay kia một bàn tay.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ ngực xuống, đẩy lên.', durationSeconds: 10 },
      { order: 3, instruction: 'Đổi vị trí tay. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Pseudo planche',
    nameEn: 'Pseudo Planche Push-up',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 60, imageUrl: null,
    description: 'Hít đất tay xoay ra sau, chuẩn bị cho kỹ năng planche.',
    steps: [
      { order: 1, instruction: 'Tư thế hít đất, xoay ngón tay ra hai bên hoặc ra sau.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ xuống chậm 3 giây.', durationSeconds: 3 },
      { order: 3, instruction: 'Đẩy lên. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Tricep dips nâng cao',
    nameEn: 'Advanced Tricep Dips',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 65, imageUrl: null,
    description: 'Tricep dips với chân đặt lên cao, tăng tải cơ tay sau.',
    steps: [
      { order: 1, instruction: 'Tay chống ghế sau lưng, chân đặt lên ghế đối diện.', durationSeconds: 5 },
      { order: 2, instruction: 'Hạ người xuống bằng cách co khuỷu tay.', durationSeconds: 5 },
      { order: 3, instruction: 'Đẩy lên. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Shoulder press hold',
    nameEn: 'Shoulder Press Hold',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 60, imageUrl: null,
    description: 'Giữ tĩnh tư thế đẩy vai, xây dựng sức mạnh isometric.',
    steps: [
      { order: 1, instruction: 'Vào tư thế pike push-up (hình chữ V ngược).', durationSeconds: 5 },
      { order: 2, instruction: 'Giữ nguyên tư thế, siết cơ vai trong suốt thời gian.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Pistol squat hỗ trợ',
    nameEn: 'Assisted Pistol Squat',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 8, caloriesBurned: 90, imageUrl: null,
    description: 'Squat một chân có hỗ trợ, bài tập sức mạnh đơn chân.',
    steps: [
      { order: 1, instruction: 'Đứng một chân, tay vịn tường hoặc cột để hỗ trợ.', durationSeconds: 5 },
      { order: 2, instruction: 'Xổm xuống trên một chân, chân kia duỗi thẳng ra trước.', durationSeconds: 10 },
      { order: 3, instruction: 'Đứng lên. Lặp lại và đổi chân.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Nordic curl',
    nameEn: 'Nordic Curl',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 75, imageUrl: null,
    description: 'Curl gân kheo, bài tập nâng cao cực kỳ hiệu quả.',
    steps: [
      { order: 1, instruction: 'Quỳ gối, nhờ người hoặc dùng vật nặng giữ gót chân.', durationSeconds: 5 },
      { order: 2, instruction: 'Từ từ hạ người về phía trước bằng cơ gân kheo.', durationSeconds: 10 },
      { order: 3, instruction: 'Dùng tay hỗ trợ khi gần chạm sàn, kéo về. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Single leg glute bridge',
    nameEn: 'Single Leg Glute Bridge',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 50, imageUrl: null,
    description: 'Cầu mông một chân, tập trung mông và cân bằng lực hai bên.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, co gối trái, chân phải duỗi thẳng.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng hông lên cao bằng chân trái, giữ thẳng.', durationSeconds: 10 },
      { order: 3, instruction: 'Hạ xuống. Lặp lại và đổi chân.', durationSeconds: 10 },
    ], isActive: true,
  },
  {
    name: 'Lateral band walk',
    nameEn: 'Lateral Band Walk',
    category: 'weights', difficulty: 'medium',
    durationMinutes: 5, caloriesBurned: 45, imageUrl: null,
    description: 'Đi bộ ngang có kháng lực, tăng cường cơ mông và hông.',
    steps: [
      { order: 1, instruction: 'Đặt dây kháng lực quanh cổ chân (hoặc không có dây cũng được).', durationSeconds: 5 },
      { order: 2, instruction: 'Xổm nhẹ, bước sang phải 10 bước.', durationSeconds: 15 },
      { order: 3, instruction: 'Bước sang trái 10 bước. Lặp lại.', durationSeconds: 15 },
    ], isActive: true,
  },
  {
    name: 'Dragon flag progression',
    nameEn: 'Dragon Flag Progression',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 8, caloriesBurned: 90, imageUrl: null,
    description: 'Tiến trình dragon flag, bài tập lõi cực khó của Bruce Lee.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa trên băng ghế, tay giữ ghế sau đầu.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng toàn thân lên thẳng đứng, giữ thẳng người.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ xuống chậm, giữ thẳng người. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Hollow body hold',
    nameEn: 'Hollow Body Hold',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 65, imageUrl: null,
    description: 'Giữ tư thế hollow body — nền tảng của thể dục dụng cụ.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, tay duỗi qua đầu, chân thẳng.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng vai và chân lên khỏi sàn vài cm, lưng dưới dính sàn.', durationSeconds: 5 },
      { order: 3, instruction: 'Giữ tư thế theo thời gian quy định.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'L-sit progression',
    nameEn: 'L-Sit Progression',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 70, imageUrl: null,
    description: 'Luyện tập tư thế L-sit, tăng sức mạnh lõi và tay.',
    steps: [
      { order: 1, instruction: 'Ngồi trên sàn, tay chống hai bên.', durationSeconds: 5 },
      { order: 2, instruction: 'Đẩy tay xuống nâng mông lên, nâng gối lên ngực trước.', durationSeconds: 10 },
      { order: 3, instruction: 'Giữ 5–10 giây, lặp lại.', durationSeconds: 15 },
    ], isActive: true,
  },
  {
    name: 'Ab wheel rollout',
    nameEn: 'Ab Wheel Rollout',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 75, imageUrl: null,
    description: 'Lăn bánh tập bụng, tăng cơ bụng sâu và ổn định lõi.',
    steps: [
      { order: 1, instruction: 'Quỳ gối, cầm bánh lăn (ab wheel) phía trước.', durationSeconds: 5 },
      { order: 2, instruction: 'Lăn ra phía trước duỗi thẳng người.', durationSeconds: 10 },
      { order: 3, instruction: 'Co bụng kéo bánh về. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Hanging knee raises',
    nameEn: 'Hanging Knee Raises',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 65, imageUrl: null,
    description: 'Treo xà nâng gối, tập cơ bụng dưới với tải trọng tự nhiên.',
    steps: [
      { order: 1, instruction: 'Treo trên xà hoặc mô phỏng tư thế treo.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng hai gối lên ngang thắt lưng, siết cơ bụng.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ xuống chậm. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Push-up + rotation',
    nameEn: 'Push-up + Rotation',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 65, imageUrl: null,
    description: 'Hít đất kết hợp xoay người cường độ cao.',
    steps: [
      { order: 1, instruction: '1 hít đất.', durationSeconds: 5 },
      { order: 2, instruction: 'Xoay người sang bên, giơ tay lên trời.', durationSeconds: 5 },
      { order: 3, instruction: 'Trở về, đổi bên. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'V-up + twist',
    nameEn: 'V-up + Twist',
    category: 'weights', difficulty: 'hard',
    durationMinutes: 5, caloriesBurned: 75, imageUrl: null,
    description: 'V-up kết hợp xoay thân, tăng cường cơ bụng toàn diện.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, tay qua đầu.', durationSeconds: 5 },
      { order: 2, instruction: 'Nâng người + chân, xoay người sang phải ở đỉnh.', durationSeconds: 5 },
      { order: 3, instruction: 'Hạ xuống, lần tiếp theo xoay sang trái. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },

  // ── Yoga ────────────────────────────────────────────────────────────────────
  {
    name: 'Cat-Cow',
    nameEn: 'Cat-Cow Pose',
    category: 'yoga', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 25, imageUrl: null,
    description: 'Động tác mèo-bò tăng linh hoạt cột sống và giảm căng lưng.',
    steps: [
      { order: 1, instruction: 'Tư thế bốn điểm chống (tay thẳng dưới vai, gối dưới hông).', durationSeconds: 5 },
      { order: 2, instruction: 'Hít vào: cong lưng xuống, ngẩng đầu và mông lên (bò).', durationSeconds: 10 },
      { order: 3, instruction: 'Thở ra: cong lưng lên, cúi đầu và thu mông vào (mèo).', durationSeconds: 10 },
      { order: 4, instruction: 'Lặp lại nhịp nhàng theo hơi thở.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: "Child's pose",
    nameEn: "Child's Pose",
    category: 'yoga', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 20, imageUrl: null,
    description: 'Tư thế em bé thư giãn nhẹ nhàng, kéo giãn lưng và hông.',
    steps: [
      { order: 1, instruction: 'Quỳ gối, ngồi xuống gót chân.', durationSeconds: 5 },
      { order: 2, instruction: 'Cúi người về trước, tay duỗi thẳng, trán chạm sàn.', durationSeconds: 10 },
      { order: 3, instruction: 'Thở sâu, giữ tư thế theo thời gian quy định.', durationSeconds: 45 },
    ], isActive: true,
  },
  {
    name: 'Spinal twist',
    nameEn: 'Spinal Twist',
    category: 'yoga', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 25, imageUrl: null,
    description: 'Xoay cột sống nhẹ nhàng, giải độc và cải thiện tiêu hóa.',
    steps: [
      { order: 1, instruction: 'Nằm ngửa, co gối phải, đặt sang bên trái.', durationSeconds: 10 },
      { order: 2, instruction: 'Tay phải duỗi thẳng sang bên, nhìn về phải.', durationSeconds: 5 },
      { order: 3, instruction: 'Giữ 30 giây. Đổi bên.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Sun salutation',
    nameEn: 'Sun Salutation',
    category: 'yoga', difficulty: 'medium',
    durationMinutes: 10, caloriesBurned: 70, imageUrl: null,
    description: 'Chào mặt trời — chuỗi 12 tư thế yoga cổ điển cho toàn thân.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, chắp tay trước ngực.', durationSeconds: 10 },
      { order: 2, instruction: 'Giơ tay lên cao, ngửa người nhẹ ra sau.', durationSeconds: 10 },
      { order: 3, instruction: 'Cúi người về trước chạm sàn.', durationSeconds: 10 },
      { order: 4, instruction: 'Bước chân ra tư thế lunges, hạ thấp.', durationSeconds: 10 },
      { order: 5, instruction: 'Đẩy vào tư thế downward dog.', durationSeconds: 15 },
      { order: 6, instruction: 'Hạ xuống tư thế cobra, ngẩng đầu.', durationSeconds: 15 },
      { order: 7, instruction: 'Đẩy lại downward dog rồi về đứng. Lặp lại.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Pigeon pose',
    nameEn: 'Pigeon Pose',
    category: 'yoga', difficulty: 'medium',
    durationMinutes: 10, caloriesBurned: 50, imageUrl: null,
    description: 'Tư thế bồ câu kéo giãn sâu cơ hông.',
    steps: [
      { order: 1, instruction: 'Từ tư thế chó úp, đưa chân phải về trước, đầu gối ra ngoài.', durationSeconds: 15 },
      { order: 2, instruction: 'Chân trái duỗi thẳng ra sau, hông song song sàn.', durationSeconds: 15 },
      { order: 3, instruction: 'Cúi người về trước, trán chạm sàn. Giữ 1 phút.', durationSeconds: 60 },
      { order: 4, instruction: 'Đổi bên. Lặp lại.', durationSeconds: 60 },
    ], isActive: true,
  },
  {
    name: 'Warrior I & II',
    nameEn: 'Warrior I & II',
    category: 'yoga', difficulty: 'medium',
    durationMinutes: 8, caloriesBurned: 55, imageUrl: null,
    description: 'Chiến binh I và II, tăng sức mạnh chân và mở hông.',
    steps: [
      { order: 1, instruction: 'Warrior I: bước chân phải trước, khuỵu gối 90°, tay lên cao.', durationSeconds: 30 },
      { order: 2, instruction: 'Chuyển sang Warrior II: mở hông sang phải, tay dang ngang.', durationSeconds: 30 },
      { order: 3, instruction: 'Đổi bên. Lặp lại.', durationSeconds: 60 },
    ], isActive: true,
  },
  {
    name: 'Deep breathing',
    nameEn: 'Deep Breathing',
    category: 'yoga', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 20, imageUrl: null,
    description: 'Thở sâu điều hòa, giảm căng thẳng và phục hồi.',
    steps: [
      { order: 1, instruction: 'Ngồi thoải mái, lưng thẳng.', durationSeconds: 10 },
      { order: 2, instruction: 'Hít vào 4 giây, giữ 4 giây, thở ra 6 giây.', durationSeconds: 14 },
      { order: 3, instruction: 'Lặp lại theo thời gian quy định.', durationSeconds: 36 },
    ], isActive: true,
  },
  {
    name: 'Cool down yoga',
    nameEn: 'Cool-Down Yoga',
    category: 'yoga', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 20, imageUrl: null,
    description: 'Chuỗi yoga hạ nhiệt nhẹ nhàng sau buổi tập cardio.',
    steps: [
      { order: 1, instruction: 'Child\'s pose 30 giây.', durationSeconds: 30 },
      { order: 2, instruction: 'Downward dog 20 giây.', durationSeconds: 20 },
      { order: 3, instruction: 'Seated forward bend 30 giây.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Yoga phục hồi',
    nameEn: 'Recovery Yoga',
    category: 'yoga', difficulty: 'easy',
    durationMinutes: 10, caloriesBurned: 30, imageUrl: null,
    description: 'Yoga nhẹ nhàng phục hồi sau buổi tập nặng.',
    steps: [
      { order: 1, instruction: 'Child\'s pose 1 phút.', durationSeconds: 60 },
      { order: 2, instruction: 'Cat-Cow 10 nhịp.', durationSeconds: 60 },
      { order: 3, instruction: 'Nằm ngửa xoay cột sống 1 phút mỗi bên.', durationSeconds: 120 },
    ], isActive: true,
  },
  {
    name: 'Hip flexor stretch',
    nameEn: 'Hip Flexor Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 20, imageUrl: null,
    description: 'Kéo giãn cơ gấp hông, giảm đau lưng và cải thiện tư thế.',
    steps: [
      { order: 1, instruction: 'Quỳ một gối xuống sàn (gối phải), chân trái bước lên trước.', durationSeconds: 10 },
      { order: 2, instruction: 'Đẩy hông về trước, cảm nhận giãn ở đùi trước và hông phải.', durationSeconds: 30 },
      { order: 3, instruction: 'Giữ 30 giây. Đổi bên.', durationSeconds: 30 },
    ], isActive: true,
  },

  // ── Stretching ──────────────────────────────────────────────────────────────
  {
    name: 'Giãn cơ toàn thân',
    nameEn: 'Full Body Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 20, imageUrl: null,
    description: 'Kéo giãn toàn thân sau buổi tập, giảm đau nhức.',
    steps: [
      { order: 1, instruction: 'Duỗi tay lên cao, kéo giãn hai bên sườn.', durationSeconds: 20 },
      { order: 2, instruction: 'Cúi người về trước giãn lưng và gân kheo.', durationSeconds: 20 },
      { order: 3, instruction: 'Xoay nhẹ cổ, vai và hông.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Giãn cơ đùi',
    nameEn: 'Quad Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 20, imageUrl: null,
    description: 'Kéo giãn cơ đùi trước sau khi chạy hoặc squat.',
    steps: [
      { order: 1, instruction: 'Đứng thẳng, tay vịn tường.', durationSeconds: 5 },
      { order: 2, instruction: 'Co gối phải, nắm cổ chân kéo gót về mông.', durationSeconds: 30 },
      { order: 3, instruction: 'Giữ 30 giây. Đổi chân.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Giãn cơ vai',
    nameEn: 'Shoulder Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 3, caloriesBurned: 15, imageUrl: null,
    description: 'Kéo giãn cơ vai sau khi tập tay và ngực.',
    steps: [
      { order: 1, instruction: 'Đưa tay phải qua ngực, tay trái giữ.', durationSeconds: 20 },
      { order: 2, instruction: 'Cảm nhận giãn ở vai phải. Giữ 20 giây.', durationSeconds: 20 },
      { order: 3, instruction: 'Đổi tay. Lặp lại.', durationSeconds: 20 },
    ], isActive: true,
  },
  {
    name: 'Giãn cơ lưng',
    nameEn: 'Back Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 15, imageUrl: null,
    description: 'Kéo giãn lưng và cột sống, giảm căng thẳng sau tập.',
    steps: [
      { order: 1, instruction: 'Ngồi duỗi thẳng chân, cúi người về trước.', durationSeconds: 30 },
      { order: 2, instruction: 'Hoặc nằm ngửa ôm gối vào ngực.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Cool down giãn cơ',
    nameEn: 'Cool Down Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 15, imageUrl: null,
    description: 'Tổng hợp các động tác giãn cơ hạ nhiệt sau cardio.',
    steps: [
      { order: 1, instruction: 'Giãn cơ đùi 20 giây mỗi bên.', durationSeconds: 40 },
      { order: 2, instruction: 'Giãn cơ bắp chân 20 giây mỗi bên.', durationSeconds: 40 },
      { order: 3, instruction: 'Giãn cơ lưng 30 giây.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Cool down',
    nameEn: 'Cool Down',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 15, imageUrl: null,
    description: 'Hạ nhiệt cơ thể sau buổi tập, ngăn ngừa đau nhức.',
    steps: [
      { order: 1, instruction: 'Đi bộ chậm tại chỗ 30 giây.', durationSeconds: 30 },
      { order: 2, instruction: 'Kéo giãn các nhóm cơ đã tập.', durationSeconds: 60 },
    ], isActive: true,
  },
  {
    name: 'Giãn cơ vai & ngực',
    nameEn: 'Shoulder & Chest Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 20, imageUrl: null,
    description: 'Kéo giãn vai và ngực sau push-up và bài tay.',
    steps: [
      { order: 1, instruction: 'Chắp tay sau lưng, mở rộng ngực, ngẩng đầu.', durationSeconds: 20 },
      { order: 2, instruction: 'Giữ 20 giây rồi thả ra.', durationSeconds: 10 },
      { order: 3, instruction: 'Đưa tay qua ngực giãn vai mỗi bên 20 giây.', durationSeconds: 40 },
    ], isActive: true,
  },
  {
    name: 'Giãn cơ đùi & lưng',
    nameEn: 'Quad & Back Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 20, imageUrl: null,
    description: 'Kết hợp giãn cơ đùi và lưng sau bài leg day.',
    steps: [
      { order: 1, instruction: 'Giãn cơ đùi trước 20 giây mỗi bên.', durationSeconds: 40 },
      { order: 2, instruction: 'Ngồi cúi người giãn lưng và gân kheo 30 giây.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Giãn cơ ngực & vai',
    nameEn: 'Chest & Shoulder Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 20, imageUrl: null,
    description: 'Kéo giãn sâu ngực và vai sau các bài push-up cường độ cao.',
    steps: [
      { order: 1, instruction: 'Đứng cạnh tường, đặt tay lên tường, xoay người ra ngoài.', durationSeconds: 30 },
      { order: 2, instruction: 'Cảm nhận giãn sâu ở ngực. Giữ 30 giây mỗi bên.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Giãn cơ chân sâu',
    nameEn: 'Deep Leg Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 5, caloriesBurned: 20, imageUrl: null,
    description: 'Kéo giãn sâu toàn bộ cơ chân sau leg power.',
    steps: [
      { order: 1, instruction: 'Pigeon pose 30 giây mỗi bên.', durationSeconds: 60 },
      { order: 2, instruction: 'Seated forward bend 30 giây.', durationSeconds: 30 },
    ], isActive: true,
  },
  {
    name: 'Giãn cơ cuối buổi',
    nameEn: 'End of Session Stretch',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 8, caloriesBurned: 20, imageUrl: null,
    description: 'Giãn cơ toàn thân cuối buổi tập.',
    steps: [
      { order: 1, instruction: 'Kéo giãn tất cả các nhóm cơ đã tập trong buổi.', durationSeconds: 90 },
    ], isActive: true,
  },
  {
    name: 'Full body cool down',
    nameEn: 'Full Body Cool Down',
    category: 'stretching', difficulty: 'easy',
    durationMinutes: 8, caloriesBurned: 20, imageUrl: null,
    description: 'Hạ nhiệt và giãn cơ toàn thân sau buổi tập advanced.',
    steps: [
      { order: 1, instruction: 'Đi bộ nhẹ tại chỗ 30 giây.', durationSeconds: 30 },
      { order: 2, instruction: 'Kéo giãn toàn bộ cơ thể từ trên xuống dưới.', durationSeconds: 90 },
    ], isActive: true,
  },
];

// ---------------------------------------------------------------------------
// 2. Định nghĩa chương trình (dùng name để tra exerciseId sau khi upsert)
// ---------------------------------------------------------------------------

type ExerciseDef = {
  name: string;
  category?: string;
  durationSeconds: number;
  restSeconds: number;
  order: number;
};

type DayDef = { dayNumber: number; title: string; exercises: ExerciseDef[] };

const PROGRAMS: {
  title: string; titleEn: string; level: string;
  description: string; estimatedWeeks: number; days: DayDef[];
}[] = [
  {
    title: 'Khởi đầu khoẻ mạnh',
    titleEn: 'Healthy Start',
    level: 'beginner',
    description: 'Chương trình 7 ngày dành cho người mới bắt đầu. Xây dựng nền tảng thể lực vững chắc.',
    estimatedWeeks: 1,
    days: [
      {
        dayNumber: 1, title: 'Khởi động toàn thân',
        exercises: [
          { name: 'Nhảy tại chỗ',        category: 'cardio',     durationSeconds: 45, restSeconds: 15, order: 1 },
          { name: 'Squat cơ bản',         category: 'weights',    durationSeconds: 40, restSeconds: 20, order: 2 },
          { name: 'Gập bụng',             category: 'weights',    durationSeconds: 30, restSeconds: 15, order: 3 },
          { name: 'Plank',                category: 'weights',    durationSeconds: 30, restSeconds: 15, order: 4 },
          { name: 'Giãn cơ toàn thân',    category: 'stretching', durationSeconds: 60, restSeconds: 0,  order: 5 },
        ],
      },
      {
        dayNumber: 2, title: 'Cơ đùi & chân',
        exercises: [
          { name: 'Lunges',           category: 'weights',    durationSeconds: 40, restSeconds: 20, order: 1 },
          { name: 'Side lunges',      category: 'weights',    durationSeconds: 40, restSeconds: 20, order: 2 },
          { name: 'Calf raises',      category: 'weights',    durationSeconds: 30, restSeconds: 15, order: 3 },
          { name: 'Wall sit',         category: 'weights',    durationSeconds: 30, restSeconds: 15, order: 4 },
          { name: 'Giãn cơ đùi',     category: 'stretching', durationSeconds: 60, restSeconds: 0,  order: 5 },
        ],
      },
      {
        dayNumber: 3, title: 'Vai & cánh tay',
        exercises: [
          { name: 'Push-ups cơ bản', category: 'weights',    durationSeconds: 30, restSeconds: 20, order: 1 },
          { name: 'Shoulder taps',   category: 'weights',    durationSeconds: 30, restSeconds: 15, order: 2 },
          { name: 'Arm circles',     category: 'weights',    durationSeconds: 20, restSeconds: 10, order: 3 },
          { name: 'Giãn cơ vai',     category: 'stretching', durationSeconds: 60, restSeconds: 0,  order: 4 },
        ],
      },
      {
        dayNumber: 4, title: 'Phục hồi & yoga nhẹ',
        exercises: [
          { name: 'Cat-Cow',            category: 'yoga',       durationSeconds: 60, restSeconds: 10, order: 1 },
          { name: "Child's pose",       category: 'yoga',       durationSeconds: 60, restSeconds: 10, order: 2 },
          { name: 'Hip flexor stretch', category: 'stretching', durationSeconds: 60, restSeconds: 10, order: 3 },
          { name: 'Spinal twist',       category: 'yoga',       durationSeconds: 60, restSeconds: 0,  order: 4 },
        ],
      },
      {
        dayNumber: 5, title: 'Cardio nhẹ',
        exercises: [
          { name: 'Jumping jacks',     category: 'cardio',     durationSeconds: 45, restSeconds: 15, order: 1 },
          { name: 'High knees',        category: 'cardio',     durationSeconds: 45, restSeconds: 15, order: 2 },
          { name: 'Butt kicks',        category: 'cardio',     durationSeconds: 45, restSeconds: 15, order: 3 },
          { name: 'Mountain climbers', category: 'cardio',     durationSeconds: 30, restSeconds: 20, order: 4 },
          { name: 'Cool down giãn cơ', category: 'stretching', durationSeconds: 60, restSeconds: 0,  order: 5 },
        ],
      },
      {
        dayNumber: 6, title: 'Core & bụng',
        exercises: [
          { name: 'Crunches',         category: 'weights',    durationSeconds: 30, restSeconds: 15, order: 1 },
          { name: 'Bicycle crunches', category: 'cardio',     durationSeconds: 30, restSeconds: 15, order: 2 },
          { name: 'Leg raises',       category: 'weights',    durationSeconds: 30, restSeconds: 15, order: 3 },
          { name: 'Russian twists',   category: 'weights',    durationSeconds: 30, restSeconds: 15, order: 4 },
          { name: 'Plank dài',        category: 'weights',    durationSeconds: 45, restSeconds: 15, order: 5 },
          { name: 'Giãn cơ lưng',    category: 'stretching', durationSeconds: 60, restSeconds: 0,  order: 6 },
        ],
      },
      {
        dayNumber: 7, title: 'Tổng hợp & kết thúc tuần',
        exercises: [
          { name: 'Khởi động tổng hợp', category: 'cardio',     durationSeconds: 120, restSeconds: 20, order: 1 },
          { name: 'Squat',              category: 'weights',    durationSeconds: 45,  restSeconds: 20, order: 2 },
          { name: 'Push-ups',           category: 'weights',    durationSeconds: 30,  restSeconds: 20, order: 3 },
          { name: 'Lunges',             category: 'weights',    durationSeconds: 45,  restSeconds: 20, order: 4 },
          { name: 'Plank',              category: 'weights',    durationSeconds: 45,  restSeconds: 20, order: 5 },
          { name: 'Jumping jacks',      category: 'cardio',     durationSeconds: 45,  restSeconds: 20, order: 6 },
          { name: 'Cool down',          category: 'stretching', durationSeconds: 120, restSeconds: 0,  order: 7 },
        ],
      },
    ],
  },

  {
    title: 'Nâng cấp sức mạnh',
    titleEn: 'Strength Builder',
    level: 'intermediate',
    description: 'Chương trình 2 tuần cho người đã có nền tảng. Tăng cường sức mạnh và sức bền toàn thân.',
    estimatedWeeks: 2,
    days: [
      {
        dayNumber: 1, title: 'Push & Pull ngày 1',
        exercises: [
          { name: 'Warm-up cardio',      category: 'cardio',     durationSeconds: 90, restSeconds: 15, order: 1 },
          { name: 'Push-ups nâng cao',   category: 'weights',    durationSeconds: 45, restSeconds: 20, order: 2 },
          { name: 'Wide push-ups',       category: 'weights',    durationSeconds: 45, restSeconds: 20, order: 3 },
          { name: 'Diamond push-ups',    category: 'weights',    durationSeconds: 30, restSeconds: 25, order: 4 },
          { name: 'Pike push-ups',       category: 'weights',    durationSeconds: 30, restSeconds: 20, order: 5 },
          { name: 'Superman',            category: 'weights',    durationSeconds: 30, restSeconds: 20, order: 6 },
          { name: 'Giãn cơ vai & ngực', category: 'stretching', durationSeconds: 60, restSeconds: 0,  order: 7 },
        ],
      },
      {
        dayNumber: 2, title: 'Legs & Core ngày 1',
        exercises: [
          { name: 'Jump squats',          category: 'cardio',     durationSeconds: 45, restSeconds: 20, order: 1 },
          { name: 'Squat pulse',          category: 'weights',    durationSeconds: 40, restSeconds: 20, order: 2 },
          { name: 'Reverse lunges',       category: 'weights',    durationSeconds: 45, restSeconds: 20, order: 3 },
          { name: 'Glute bridge',         category: 'weights',    durationSeconds: 45, restSeconds: 15, order: 4 },
          { name: 'Plank shoulder tap',   category: 'weights',    durationSeconds: 40, restSeconds: 20, order: 5 },
          { name: 'Side plank',           category: 'weights',    durationSeconds: 30, restSeconds: 15, order: 6 },
          { name: 'Giãn cơ đùi & lưng', category: 'stretching', durationSeconds: 60, restSeconds: 0,  order: 7 },
        ],
      },
      {
        dayNumber: 3, title: 'Cardio & Agility',
        exercises: [
          { name: 'Jump rope simulation',    category: 'cardio',  durationSeconds: 60, restSeconds: 20, order: 1 },
          { name: 'Burpees',                 category: 'cardio',  durationSeconds: 40, restSeconds: 25, order: 2 },
          { name: 'Speed skaters',           category: 'cardio',  durationSeconds: 45, restSeconds: 20, order: 3 },
          { name: 'Box jumps tại chỗ',       category: 'cardio',  durationSeconds: 40, restSeconds: 25, order: 4 },
          { name: 'Mountain climbers nhanh', category: 'cardio',  durationSeconds: 40, restSeconds: 20, order: 5 },
          { name: 'Cool down yoga',          category: 'yoga',    durationSeconds: 90, restSeconds: 0,  order: 6 },
        ],
      },
      {
        dayNumber: 4, title: 'Recovery & Mobility',
        exercises: [
          { name: 'Sun salutation', category: 'yoga', durationSeconds: 120, restSeconds: 15, order: 1 },
          { name: 'Pigeon pose',    category: 'yoga', durationSeconds: 60,  restSeconds: 10, order: 2 },
          { name: 'Warrior I & II', category: 'yoga', durationSeconds: 90,  restSeconds: 10, order: 3 },
          { name: 'Deep breathing', category: 'yoga', durationSeconds: 60,  restSeconds: 0,  order: 4 },
        ],
      },
      {
        dayNumber: 5, title: 'Full Body Strength',
        exercises: [
          { name: 'Inchworm',           category: 'weights',    durationSeconds: 60, restSeconds: 20, order: 1 },
          { name: 'Bulgarian split squat', category: 'weights', durationSeconds: 45, restSeconds: 25, order: 2 },
          { name: 'Push-ups + rotation', category: 'weights',   durationSeconds: 40, restSeconds: 20, order: 3 },
          { name: 'Glute bridge march',  category: 'weights',   durationSeconds: 40, restSeconds: 20, order: 4 },
          { name: 'Bear crawl',          category: 'cardio',    durationSeconds: 30, restSeconds: 20, order: 5 },
          { name: 'Dead bug',            category: 'weights',   durationSeconds: 40, restSeconds: 20, order: 6 },
          { name: 'Giãn cơ cuối buổi', category: 'stretching', durationSeconds: 90, restSeconds: 0,  order: 7 },
        ],
      },
    ],
  },

  {
    title: 'Thử thách đỉnh cao',
    titleEn: 'Peak Challenge',
    level: 'advanced',
    description: 'Chương trình 3 tuần cường độ cao. Dành cho người có thể lực tốt, muốn phá vỡ giới hạn bản thân.',
    estimatedWeeks: 3,
    days: [
      {
        dayNumber: 1, title: 'HIIT Đốt mỡ',
        exercises: [
          { name: 'Dynamic warm-up',   category: 'cardio',     durationSeconds: 120, restSeconds: 15, order: 1 },
          { name: 'Burpee pull-through', category: 'cardio',   durationSeconds: 40,  restSeconds: 20, order: 2 },
          { name: 'Tuck jumps',        category: 'cardio',     durationSeconds: 30,  restSeconds: 25, order: 3 },
          { name: 'Plyo push-ups',     category: 'weights',    durationSeconds: 30,  restSeconds: 25, order: 4 },
          { name: 'Jump lunges',       category: 'cardio',     durationSeconds: 40,  restSeconds: 20, order: 5 },
          { name: 'Sprint tại chỗ',   category: 'cardio',     durationSeconds: 30,  restSeconds: 30, order: 6 },
          { name: 'V-ups',             category: 'weights',    durationSeconds: 30,  restSeconds: 20, order: 7 },
          { name: 'Cool down',         category: 'stretching', durationSeconds: 90,  restSeconds: 0,  order: 8 },
        ],
      },
      {
        dayNumber: 2, title: 'Sức mạnh cơ trên',
        exercises: [
          { name: 'Archer push-ups',     category: 'weights',    durationSeconds: 45, restSeconds: 25, order: 1 },
          { name: 'Pike push-ups nâng',  category: 'weights',    durationSeconds: 40, restSeconds: 25, order: 2 },
          { name: 'Staggered push-ups',  category: 'weights',    durationSeconds: 40, restSeconds: 25, order: 3 },
          { name: 'Pseudo planche',      category: 'weights',    durationSeconds: 20, restSeconds: 30, order: 4 },
          { name: 'Tricep dips nâng cao', category: 'weights',   durationSeconds: 40, restSeconds: 20, order: 5 },
          { name: 'Shoulder press hold', category: 'weights',    durationSeconds: 30, restSeconds: 20, order: 6 },
          { name: 'Giãn cơ ngực & vai', category: 'stretching', durationSeconds: 90, restSeconds: 0,  order: 7 },
        ],
      },
      {
        dayNumber: 3, title: 'Legs Power',
        exercises: [
          { name: 'Pistol squat hỗ trợ', category: 'weights',    durationSeconds: 45, restSeconds: 30, order: 1 },
          { name: 'Jump squat series',   category: 'cardio',     durationSeconds: 40, restSeconds: 25, order: 2 },
          { name: 'Nordic curl',         category: 'weights',    durationSeconds: 30, restSeconds: 30, order: 3 },
          { name: 'Single leg glute bridge', category: 'weights', durationSeconds: 40, restSeconds: 20, order: 4 },
          { name: 'Lateral band walk',   category: 'weights',    durationSeconds: 40, restSeconds: 20, order: 5 },
          { name: 'Step-up với nhảy',   category: 'cardio',     durationSeconds: 40, restSeconds: 20, order: 6 },
          { name: 'Giãn cơ chân sâu',  category: 'stretching', durationSeconds: 90, restSeconds: 0,  order: 7 },
        ],
      },
      {
        dayNumber: 4, title: 'Core đỉnh cao',
        exercises: [
          { name: 'Dragon flag progression', category: 'weights', durationSeconds: 30, restSeconds: 30, order: 1 },
          { name: 'Hollow body hold',    category: 'weights',    durationSeconds: 30, restSeconds: 25, order: 2 },
          { name: 'L-sit progression',   category: 'weights',    durationSeconds: 20, restSeconds: 30, order: 3 },
          { name: 'Ab wheel rollout',    category: 'weights',    durationSeconds: 30, restSeconds: 25, order: 4 },
          { name: 'Hanging knee raises', category: 'weights',    durationSeconds: 40, restSeconds: 20, order: 5 },
          { name: 'Plank variations',    category: 'weights',    durationSeconds: 60, restSeconds: 20, order: 6 },
          { name: 'Yoga phục hồi',      category: 'yoga',       durationSeconds: 120, restSeconds: 0, order: 7 },
        ],
      },
      {
        dayNumber: 5, title: 'Full Body Endurance',
        exercises: [
          { name: 'Complex warm-up',      category: 'cardio',     durationSeconds: 120, restSeconds: 20, order: 1 },
          { name: 'Burpee + push-up',     category: 'cardio',     durationSeconds: 45,  restSeconds: 20, order: 2 },
          { name: 'Jump squat + lunge',   category: 'cardio',     durationSeconds: 45,  restSeconds: 20, order: 3 },
          { name: 'Push-up + rotation',   category: 'weights',    durationSeconds: 40,  restSeconds: 20, order: 4 },
          { name: 'Mountain climber fast', category: 'cardio',    durationSeconds: 40,  restSeconds: 20, order: 5 },
          { name: 'V-up + twist',         category: 'weights',    durationSeconds: 35,  restSeconds: 20, order: 6 },
          { name: 'Sprint final',         category: 'cardio',     durationSeconds: 30,  restSeconds: 30, order: 7 },
          { name: 'Full body cool down',  category: 'stretching', durationSeconds: 120, restSeconds: 0,  order: 8 },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// 3. Seed function
// ---------------------------------------------------------------------------

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI chưa được set trong .env');

  console.log('🔌 Kết nối MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ Đã kết nối.\n');

  // ── 3a. Upsert exercises ──────────────────────────────────────────────────
  console.log(`📋 Upsert ${EXERCISES.length} bài tập...`);
  const nameToId = new Map<string, string>();

  for (const ex of EXERCISES) {
    const doc = await Exercise.findOneAndUpdate(
      { name: ex.name },
      { $setOnInsert: ex },
      { upsert: true, new: true },
    );
    nameToId.set(ex.name, String(doc._id));
  }
  console.log(`✅ Đã upsert ${nameToId.size} bài tập.\n`);

  // ── 3b. Xử lý chương trình ───────────────────────────────────────────────
  for (const progDef of PROGRAMS) {
    // Build days với exerciseId đã được link
    const days = progDef.days.map((day) => ({
      dayNumber: day.dayNumber,
      title: day.title,
      exercises: day.exercises.map((ex) => {
        const exerciseId = nameToId.get(ex.name);
        if (!exerciseId) {
          console.warn(`  ⚠️  Không tìm thấy exerciseId cho "${ex.name}"`);
        }
        return {
          exerciseId: exerciseId ? new mongoose.Types.ObjectId(exerciseId) : undefined,
          exerciseName: ex.name,
          category: ex.category,
          durationSeconds: ex.durationSeconds,
          restSeconds: ex.restSeconds,
          order: ex.order,
        };
      }),
    }));

    const existing = await WorkoutProgram.findOne({ level: progDef.level });

    if (!existing) {
      // Tạo mới
      await WorkoutProgram.create({ ...progDef, days, isActive: true });
      console.log(`✅ Tạo mới chương trình "${progDef.title}" (${progDef.level})`);
    } else {
      // Cập nhật exercises + link exerciseId
      existing.days = days as typeof existing.days;
      existing.title = progDef.title;
      existing.titleEn = progDef.titleEn;
      existing.description = progDef.description;
      existing.estimatedWeeks = progDef.estimatedWeeks;
      await existing.save();
      console.log(`🔄 Cập nhật chương trình "${progDef.title}" (${progDef.level})`);
    }
  }

  console.log('\n🎉 Seed hoàn tất!');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Seed thất bại:', err);
  process.exit(1);
});

-- Data migration from SQLite to D1
-- Generated on: 2025-06-08T12:57:19.954Z

INSERT INTO users (id, username, email, password_hash, created_date) VALUES (6, 'kagerw', 'kagerw093@gmail.com', '$2a$10$rS6SWCBc7x6aSwcpalhR7OCUZ7QodonZc5dwzKX4yoEHm05mA30uu', '2025-06-08 10:10:34');
INSERT INTO users (id, username, email, password_hash, created_date) VALUES (7, 'testuser', 'khideaki77@gmail.com', '$2a$10$HJ7xTHHE5UtY19w1DmCPuOlagmCpwpLrqmW1hM.Q.Sk37OBcAJ8oC', '2025-06-08 10:48:45');
INSERT INTO medicines (id, user_id, name, quantity, dosage, frequency, notes, added_date, updated_date) VALUES (2, 6, 'ストラテラ', 222, '3', '一日一回朝', '', '2025-06-08 10:11:32', '2025-06-08 10:11:32');
INSERT INTO medicines (id, user_id, name, quantity, dosage, frequency, notes, added_date, updated_date) VALUES (3, 6, 'レメロン', 91, '3', '1日1回夕食後', '', '2025-06-08 10:11:52', '2025-06-08 10:11:52');
INSERT INTO medicines (id, user_id, name, quantity, dosage, frequency, notes, added_date, updated_date) VALUES (4, 6, 'クエチアピン', 8, '', '', '', '2025-06-08 10:12:18', '2025-06-08 10:12:18');
INSERT INTO medicines (id, user_id, name, quantity, dosage, frequency, notes, added_date, updated_date) VALUES (5, 6, 'サイレース', 21, '2錠', '1日1回寝る前', '', '2025-06-08 10:13:08', '2025-06-08 10:13:08');
INSERT INTO medicines (id, user_id, name, quantity, dosage, frequency, notes, added_date, updated_date) VALUES (6, 6, 'スルピリド', 75, '', '', '', '2025-06-08 10:13:21', '2025-06-08 10:13:21');
INSERT INTO medicines (id, user_id, name, quantity, dosage, frequency, notes, added_date, updated_date) VALUES (7, 6, 'ヒルナミン', 24, '', '', '', '2025-06-08 10:13:33', '2025-06-08 10:13:33');
INSERT INTO medicine_history (id, user_id, action, medicine_name, quantity, notes, created_date) VALUES (1, 6, '処方追加', 'aaa', 111, '', '2025-06-08 10:10:45');
INSERT INTO medicine_history (id, user_id, action, medicine_name, quantity, notes, created_date) VALUES (2, 6, '処方追加', 'ストラテラ', 222, '3, 一日一回朝', '2025-06-08 10:11:32');
INSERT INTO medicine_history (id, user_id, action, medicine_name, quantity, notes, created_date) VALUES (3, 6, '処方追加', 'レメロン', 91, '3, 1日1回夕食後', '2025-06-08 10:11:52');
INSERT INTO medicine_history (id, user_id, action, medicine_name, quantity, notes, created_date) VALUES (4, 6, '処方追加', 'クエチアピン', 8, '', '2025-06-08 10:12:18');
INSERT INTO medicine_history (id, user_id, action, medicine_name, quantity, notes, created_date) VALUES (5, 6, '処方追加', 'サイレース', 21, '2錠, 1日1回寝る前', '2025-06-08 10:13:08');
INSERT INTO medicine_history (id, user_id, action, medicine_name, quantity, notes, created_date) VALUES (6, 6, '処方追加', 'スルピリド', 75, '', '2025-06-08 10:13:21');
INSERT INTO medicine_history (id, user_id, action, medicine_name, quantity, notes, created_date) VALUES (7, 6, '処方追加', 'ヒルナミン', 24, '', '2025-06-08 10:13:33');
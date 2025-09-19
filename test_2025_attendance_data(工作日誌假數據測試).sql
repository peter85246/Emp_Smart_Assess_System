-- 2025年員工出勤測試數據
-- 為Manager、李加工、王檢驗創建工作日誌記錄

-- Manager - 2025年9月 (18天記錄，出勤率約86%)
INSERT INTO "WorkLogs" ("EmployeeId", "LogDate", "Title", "Description", "Status", "CreatedAt", "UpdatedAt") VALUES
(2, '2025-09-01', 'Monthly Planning', 'September planning and goal setting', 'approved', NOW(), NOW()),
(2, '2025-09-02', 'Team Meeting', 'Weekly team coordination meeting', 'approved', NOW(), NOW()),
(2, '2025-09-03', 'Project Review', 'Q3 project progress review', 'approved', NOW(), NOW()),
(2, '2025-09-05', 'Performance Analysis', 'Team performance metrics analysis', 'approved', NOW(), NOW()),
(2, '2025-09-08', 'Budget Review', 'Monthly budget and expense review', 'approved', NOW(), NOW()),
(2, '2025-09-09', 'Training Session', 'Staff development training', 'approved', NOW(), NOW()),
(2, '2025-09-10', 'Quality Assessment', 'Product quality evaluation', 'approved', NOW(), NOW()),
(2, '2025-09-11', 'Management Meeting', 'Senior management coordination', 'approved', NOW(), NOW()),
(2, '2025-09-12', 'Resource Planning', 'Q4 resource allocation planning', 'approved', NOW(), NOW()),
(2, '2025-09-15', 'Process Improvement', 'Workflow optimization review', 'approved', NOW(), NOW()),
(2, '2025-09-17', 'Client Meeting', 'Key client relationship management', 'approved', NOW(), NOW()),
(2, '2025-09-18', 'Staff Evaluation', 'Employee performance evaluation', 'approved', NOW(), NOW()),
(2, '2025-09-19', 'Strategic Planning', 'Long-term strategy development', 'approved', NOW(), NOW()),
(2, '2025-09-22', 'Vendor Meeting', 'Supplier relationship management', 'approved', NOW(), NOW()),
(2, '2025-09-24', 'Skills Development', 'Team capability enhancement', 'approved', NOW(), NOW()),
(2, '2025-09-26', 'Monthly Report', 'September performance summary', 'approved', NOW(), NOW()),
(2, '2025-09-29', 'Quarter End Review', 'Q3 comprehensive review', 'approved', NOW(), NOW()),
(2, '2025-09-30', 'October Planning', 'Next month preparation', 'approved', NOW(), NOW());

-- 李加工 - 2025年1月 (20天記錄，出勤率約87%)
INSERT INTO "WorkLogs" ("EmployeeId", "LogDate", "Title", "Description", "Status", "CreatedAt", "UpdatedAt") VALUES
(3, '2025-01-02', 'New Year Work Start', 'Resume work after holiday', 'approved', NOW(), NOW()),
(3, '2025-01-03', 'Machine Setup', 'Production line equipment setup', 'approved', NOW(), NOW()),
(3, '2025-01-06', 'Production Planning', 'Weekly production schedule', 'approved', NOW(), NOW()),
(3, '2025-01-07', 'Quality Control', 'Product quality inspection', 'approved', NOW(), NOW()),
(3, '2025-01-08', 'Machine Maintenance', 'Routine equipment maintenance', 'approved', NOW(), NOW()),
(3, '2025-01-09', 'Production Monitoring', 'Line efficiency monitoring', 'approved', NOW(), NOW()),
(3, '2025-01-10', 'Tool Preparation', 'Production tools organization', 'approved', NOW(), NOW()),
(3, '2025-01-13', 'Process Optimization', 'Workflow improvement', 'approved', NOW(), NOW()),
(3, '2025-01-14', 'Material Inspection', 'Raw material quality check', 'approved', NOW(), NOW()),
(3, '2025-01-16', 'Equipment Calibration', 'Precision equipment adjustment', 'approved', NOW(), NOW()),
(3, '2025-01-17', 'Production Report', 'Daily output documentation', 'approved', NOW(), NOW()),
(3, '2025-01-20', 'New Order Processing', 'Customer order preparation', 'approved', NOW(), NOW()),
(3, '2025-01-21', 'Efficiency Analysis', 'Production efficiency review', 'approved', NOW(), NOW()),
(3, '2025-01-22', 'Safety Check', 'Workplace safety inspection', 'approved', NOW(), NOW()),
(3, '2025-01-23', 'Team Coordination', 'Production team meeting', 'approved', NOW(), NOW()),
(3, '2025-01-24', 'Equipment Upgrade', 'Machine capability enhancement', 'approved', NOW(), NOW()),
(3, '2025-01-27', 'Monthly Inventory', 'Stock and material count', 'approved', NOW(), NOW()),
(3, '2025-01-28', 'Process Documentation', 'Standard procedure update', 'approved', NOW(), NOW()),
(3, '2025-01-30', 'Quality Improvement', 'Product quality enhancement', 'approved', NOW(), NOW()),
(3, '2025-01-31', 'Month End Summary', 'January performance summary', 'approved', NOW(), NOW());

-- 王檢驗 - 2025年1月 (21天記錄，出勤率約91%)
INSERT INTO "WorkLogs" ("EmployeeId", "LogDate", "Title", "Description", "Status", "CreatedAt", "UpdatedAt") VALUES
(4, '2025-01-02', 'Inspection Planning', 'Monthly inspection schedule', 'approved', NOW(), NOW()),
(4, '2025-01-03', 'Equipment Check', 'Testing equipment calibration', 'approved', NOW(), NOW()),
(4, '2025-01-06', 'Incoming Inspection', 'Raw material quality check', 'approved', NOW(), NOW()),
(4, '2025-01-07', 'Process Inspection', 'In-process quality control', 'approved', NOW(), NOW()),
(4, '2025-01-08', 'Final Inspection', 'Finished product examination', 'approved', NOW(), NOW()),
(4, '2025-01-09', 'Defect Analysis', 'Quality issue investigation', 'approved', NOW(), NOW()),
(4, '2025-01-10', 'Inspection Report', 'Daily quality report', 'approved', NOW(), NOW()),
(4, '2025-01-13', 'Supplier Audit', 'Vendor quality assessment', 'approved', NOW(), NOW()),
(4, '2025-01-14', 'Standard Review', 'Quality standard update', 'approved', NOW(), NOW()),
(4, '2025-01-15', 'Customer Complaint', 'Quality issue resolution', 'approved', NOW(), NOW()),
(4, '2025-01-16', 'Corrective Action', 'Quality improvement action', 'approved', NOW(), NOW()),
(4, '2025-01-17', 'Training Session', 'Quality control training', 'approved', NOW(), NOW()),
(4, '2025-01-20', 'Measurement System', 'Testing system validation', 'approved', NOW(), NOW()),
(4, '2025-01-21', 'Statistical Analysis', 'Quality data analysis', 'approved', NOW(), NOW()),
(4, '2025-01-22', 'Process Control', 'Quality process monitoring', 'approved', NOW(), NOW()),
(4, '2025-01-23', 'Documentation Update', 'Quality procedure revision', 'approved', NOW(), NOW()),
(4, '2025-01-24', 'Improvement Plan', 'Quality enhancement strategy', 'approved', NOW(), NOW()),
(4, '2025-01-27', 'Internal Audit', 'Quality system audit', 'approved', NOW(), NOW()),
(4, '2025-01-28', 'Trend Analysis', 'Quality trend evaluation', 'approved', NOW(), NOW()),
(4, '2025-01-30', 'Monthly Review', 'January quality summary', 'approved', NOW(), NOW()),
(4, '2025-01-31', 'February Planning', 'Next month preparation', 'approved', NOW(), NOW());

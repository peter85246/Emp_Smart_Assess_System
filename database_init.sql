-- 積分管理系統資料庫初始化腳本 (包含通知系統)
-- 在PostgreSQL Query Tool中執行此腳本

-- 創建資料庫（如果尚未創建）
-- CREATE DATABASE "PointsManagementDB";

-- 使用資料庫
-- \c PointsManagementDB;

-- 連線資訊確認
-- Host: 127.0.0.1
-- Port: 5432
-- Database: PointsManagementDB
-- Username: postgres
-- Password: paw123456

-- 1. 創建部門表
CREATE TABLE IF NOT EXISTS "Departments" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 創建員工表
CREATE TABLE IF NOT EXISTS "Employees" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(50) NOT NULL,
    "EmployeeNumber" VARCHAR(20) NOT NULL UNIQUE,
    "Email" VARCHAR(100),
    "DepartmentId" INTEGER REFERENCES "Departments"("Id"),
    "Position" VARCHAR(50),
    "Role" VARCHAR(20) DEFAULT 'employee',
    "IsActive" BOOLEAN DEFAULT TRUE,
    "HireDate" TIMESTAMP,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 創建積分類別表
CREATE TABLE IF NOT EXISTS "PointsCategories" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Type" VARCHAR(50) NOT NULL,
    "Description" VARCHAR(500),
    "Color" VARCHAR(20) DEFAULT '#3B82F6',
    "Multiplier" DECIMAL(3,2) DEFAULT 1.0,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 創建評分標準表
CREATE TABLE IF NOT EXISTS "StandardSettings" (
    "Id" SERIAL PRIMARY KEY,
    "CategoryName" VARCHAR(100) NOT NULL,
    "PointsValue" DECIMAL(6,2) NOT NULL,
    "PointsType" VARCHAR(50) NOT NULL DEFAULT 'general',
    "InputType" VARCHAR(20) DEFAULT 'number',
    "DepartmentId" INTEGER REFERENCES "Departments"("Id"),
    "PositionId" INTEGER,
    "Description" VARCHAR(1000),
    "CalculationFormula" TEXT,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "ParentId" INTEGER REFERENCES "StandardSettings"("Id"),
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 檢查並添加StandardSettings表的新欄位（如果不存在）
DO $$
BEGIN
    -- 添加InputType欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'StandardSettings' AND column_name = 'InputType'
    ) THEN
        ALTER TABLE "StandardSettings" ADD COLUMN "InputType" VARCHAR(20) DEFAULT 'number';
    END IF;

    -- 添加CalculationFormula欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'StandardSettings' AND column_name = 'CalculationFormula'
    ) THEN
        ALTER TABLE "StandardSettings" ADD COLUMN "CalculationFormula" TEXT;
    END IF;

    -- 添加PositionId欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'StandardSettings' AND column_name = 'PositionId'
    ) THEN
        ALTER TABLE "StandardSettings" ADD COLUMN "PositionId" INTEGER;
    END IF;

    -- 確保PointsType有默認值
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'StandardSettings' AND column_name = 'PointsType'
        AND column_default IS NULL
    ) THEN
        ALTER TABLE "StandardSettings" ALTER COLUMN "PointsType" SET DEFAULT 'general';
    END IF;
END $$;

-- 5. 創建積分記錄表
CREATE TABLE IF NOT EXISTS "PointsEntries" (
    "Id" SERIAL PRIMARY KEY,
    "EmployeeId" INTEGER NOT NULL REFERENCES "Employees"("Id"),
    "StandardId" INTEGER NOT NULL REFERENCES "StandardSettings"("Id"),
    "EntryDate" TIMESTAMP NOT NULL,
    "InputValue" DECIMAL(10,2) DEFAULT 1,
    "BasePoints" DECIMAL(6,2) NOT NULL,
    "BonusPoints" DECIMAL(6,2) DEFAULT 0,
    "PenaltyPoints" DECIMAL(6,2) DEFAULT 0,
    "PromotionMultiplier" DECIMAL(3,2) DEFAULT 1.0,
    "PointsEarned" DECIMAL(6,2) NOT NULL,
    "Description" TEXT,
    "Status" VARCHAR(20) DEFAULT 'pending',
    "ReviewedBy" INTEGER REFERENCES "Employees"("Id"),
    "ReviewedAt" TIMESTAMP,
    "ReviewComments" TEXT,
    "EvidenceFiles" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 檢查並添加PointsEntries表的新欄位（如果不存在）
DO $$
BEGIN
    -- 添加EvidenceFiles欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'PointsEntries' AND column_name = 'EvidenceFiles'
    ) THEN
        ALTER TABLE "PointsEntries" ADD COLUMN "EvidenceFiles" TEXT;
    END IF;

    -- 確保EntryDate是TIMESTAMP類型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'PointsEntries' AND column_name = 'EntryDate'
        AND data_type = 'date'
    ) THEN
        ALTER TABLE "PointsEntries" ALTER COLUMN "EntryDate" TYPE TIMESTAMP;
    END IF;
END $$;

-- 6. 創建工作日誌類別表
CREATE TABLE IF NOT EXISTS "LogCategories" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "Color" VARCHAR(20) DEFAULT '#6B7280',
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. 創建工作日誌表
CREATE TABLE IF NOT EXISTS "WorkLogs" (
    "Id" SERIAL PRIMARY KEY,
    "EmployeeId" INTEGER NOT NULL REFERENCES "Employees"("Id"),
    "CategoryId" INTEGER REFERENCES "LogCategories"("Id"),
    "LogDate" TIMESTAMP NOT NULL,
    "Title" VARCHAR(200) NOT NULL,
    "Content" TEXT,
    "Tags" VARCHAR(500),
    "Attachments" TEXT,
    "PointsClaimed" DECIMAL(5,2) DEFAULT 0,
    "Status" VARCHAR(20) DEFAULT 'submitted',
    "ReviewedBy" INTEGER REFERENCES "Employees"("Id"),
    "ReviewedAt" TIMESTAMP,
    "ReviewComments" TEXT,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

-- 檢查並添加WorkLogs表的新欄位（如果不存在）
DO $$
BEGIN
    -- 添加ReviewedBy欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'WorkLogs' AND column_name = 'ReviewedBy'
    ) THEN
        ALTER TABLE "WorkLogs" ADD COLUMN "ReviewedBy" INTEGER REFERENCES "Employees"("Id");
    END IF;

    -- 添加ReviewedAt欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'WorkLogs' AND column_name = 'ReviewedAt'
    ) THEN
        ALTER TABLE "WorkLogs" ADD COLUMN "ReviewedAt" TIMESTAMP;
    END IF;

    -- 添加ReviewComments欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'WorkLogs' AND column_name = 'ReviewComments'
    ) THEN
        ALTER TABLE "WorkLogs" ADD COLUMN "ReviewComments" TEXT;
    END IF;

    -- 添加Tags欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'WorkLogs' AND column_name = 'Tags'
    ) THEN
        ALTER TABLE "WorkLogs" ADD COLUMN "Tags" TEXT;
    END IF;

    -- 添加Content欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'WorkLogs' AND column_name = 'Content'
    ) THEN
        ALTER TABLE "WorkLogs" ADD COLUMN "Content" TEXT;
    END IF;

    -- 添加Attachments欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'WorkLogs' AND column_name = 'Attachments'
    ) THEN
        ALTER TABLE "WorkLogs" ADD COLUMN "Attachments" TEXT;
    END IF;

    -- 添加PointsClaimed欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'WorkLogs' AND column_name = 'PointsClaimed'
    ) THEN
        ALTER TABLE "WorkLogs" ADD COLUMN "PointsClaimed" DECIMAL(5,2) DEFAULT 0;
    END IF;

    -- 添加Status欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'WorkLogs' AND column_name = 'Status'
    ) THEN
        ALTER TABLE "WorkLogs" ADD COLUMN "Status" VARCHAR(20) DEFAULT 'submitted';
    END IF;
END $$;

-- 8. 創建檔案附件表
CREATE TABLE IF NOT EXISTS "FileAttachments" (
    "Id" SERIAL PRIMARY KEY,
    "FileName" VARCHAR(255) NOT NULL,
    "FilePath" VARCHAR(255) NOT NULL,
    "ContentType" VARCHAR(100),
    "FileSize" BIGINT NOT NULL,
    "EntityType" VARCHAR(50) NOT NULL,
    "EntityId" INTEGER NOT NULL,
    "UploadedBy" INTEGER NOT NULL,
    "UploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "IsActive" BOOLEAN DEFAULT TRUE
);

-- 9. 創建目標設定表
CREATE TABLE IF NOT EXISTS "TargetSettings" (
    "Id" SERIAL PRIMARY KEY,
    "EmployeeId" INTEGER NOT NULL REFERENCES "Employees"("Id"),
    "Year" INTEGER NOT NULL,
    "Month" INTEGER NOT NULL,
    "TargetPoints" DECIMAL(6,2) NOT NULL,
    "MinimumPassingPercentage" DECIMAL(5,2) DEFAULT 62.0,
    "Notes" VARCHAR(1000),
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

-- 10. 創建計算規則表
CREATE TABLE IF NOT EXISTS "CalculationRules" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "RuleType" VARCHAR(50) NOT NULL,
    "Conditions" VARCHAR(1000),
    "Value" DECIMAL(6,2) NOT NULL,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UpdatedAt" TIMESTAMP
);

-- *** 11. 創建通知系統表 (新增) ***
CREATE TABLE IF NOT EXISTS "Notifications" (
    "Id" SERIAL PRIMARY KEY,
    "UserId" INTEGER NOT NULL REFERENCES "Employees"("Id"),
    "Title" VARCHAR(200) NOT NULL,
    "Content" VARCHAR(1000) NOT NULL,
    "Type" VARCHAR(50) NOT NULL,
    "RelatedEntityId" INTEGER NULL,
    "RelatedEntityType" VARCHAR(50) NULL,
    "IsRead" BOOLEAN NOT NULL DEFAULT FALSE,
    "CreatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "ReadAt" TIMESTAMPTZ NULL,
    "Priority" VARCHAR(20) NOT NULL DEFAULT 'normal'
);

-- 檢查並添加Employees表的認證相關欄位
DO $$
BEGIN
    -- 添加PasswordHash欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Employees' AND column_name = 'PasswordHash'
    ) THEN
        ALTER TABLE "Employees" ADD COLUMN "PasswordHash" VARCHAR(255) NOT NULL DEFAULT '';
    END IF;

    -- 添加LastLoginAt欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Employees' AND column_name = 'LastLoginAt'
    ) THEN
        ALTER TABLE "Employees" ADD COLUMN "LastLoginAt" TIMESTAMP;
    END IF;

    -- 添加IsFirstLogin欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Employees' AND column_name = 'IsFirstLogin'
    ) THEN
        ALTER TABLE "Employees" ADD COLUMN "IsFirstLogin" BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- 插入初始資料

-- 插入部門資料
INSERT INTO "Departments" ("Id", "Name", "Description") VALUES
(1, '製造部', '生產製造部門'),
(2, '品質工程部', '品質控制與工程部門'),
(3, '管理部', '行政管理部門'),
(4, '業務部', '業務銷售部門')
ON CONFLICT ("Id") DO NOTHING;

-- 清除現有員工數據（每次執行時重置為乾淨狀態）
-- 依照外鍵約束順序，先清除相關資料表的數據
DO $$
BEGIN
    -- 清除依賴於 Employees 的數據
    DELETE FROM "PointsEntries";
    DELETE FROM "WorkLogs";
    DELETE FROM "TargetSettings";
    DELETE FROM "Notifications";  -- 新增：清除通知數據
    DELETE FROM "FileAttachments" WHERE "EntityType" = 'Employee';
    
    -- 清除員工數據
    DELETE FROM "Employees";
    
    -- 重置序列值
    ALTER SEQUENCE "Employees_Id_seq" RESTART WITH 1;
    ALTER SEQUENCE "PointsEntries_Id_seq" RESTART WITH 1;
    ALTER SEQUENCE "WorkLogs_Id_seq" RESTART WITH 1;
    ALTER SEQUENCE "TargetSettings_Id_seq" RESTART WITH 1;
    ALTER SEQUENCE "Notifications_Id_seq" RESTART WITH 1;  -- 新增：重置通知序列
    ALTER SEQUENCE "FileAttachments_Id_seq" RESTART WITH 1;
    
    RAISE NOTICE '已清除所有員工相關數據（包含通知），系統重置為乾淨狀態';
END $$;

-- 插入員工資料（預設帳號已移除，請手動創建測試帳號）
--
-- 範例格式：
-- INSERT INTO "Employees" ("Name", "EmployeeNumber", "Email", "DepartmentId", "Position", "Role", "HireDate", "PasswordHash") VALUES
-- ('員工姓名', '員工編號', 'email@company.com', 部門ID, '職位', '角色', CURRENT_TIMESTAMP, '密碼哈希')
--
-- 角色選項：
--   'employee' (員工)
--   'manager' (主管)
--   'admin' (管理員)
--   'president' (總經理)
--   'boss' (董事長)
--
-- 部門ID：
--   1 = 製造部
--   2 = 品質工程部
--   3 = 管理部
--   4 = 業務部
--
-- 注意：密碼哈希需要使用 BCrypt 加密
-- 建議使用系統的註冊功能來創建帳號，系統會自動處理密碼加密

-- 工作日誌分類數據遷移：將舊分類更新為積分項目分類
-- 如果存在舊的工作日誌記錄，先進行數據遷移
DO $$
BEGIN
    -- 檢查是否有使用舊分類的工作日誌記錄
    IF EXISTS (SELECT 1 FROM "LogCategories" WHERE "Name" IN ('生產作業', '品質檢驗', '設備維護', '改善提案', '教育訓練', '其他事項')) THEN
        -- 更新現有的工作日誌記錄的分類引用
        UPDATE "WorkLogs" 
        SET "CategoryId" = CASE 
            WHEN "CategoryId" = (SELECT "Id" FROM "LogCategories" WHERE "Name" = '生產作業' LIMIT 1) 
                THEN 1  -- 一般積分項目
            WHEN "CategoryId" = (SELECT "Id" FROM "LogCategories" WHERE "Name" = '品質檢驗' LIMIT 1) 
                THEN 2  -- 品質工程積分項目
            WHEN "CategoryId" = (SELECT "Id" FROM "LogCategories" WHERE "Name" = '設備維護' LIMIT 1) 
                THEN 3  -- 專業積分項目
            WHEN "CategoryId" = (SELECT "Id" FROM "LogCategories" WHERE "Name" = '改善提案' LIMIT 1) 
                THEN 3  -- 專業積分項目
            WHEN "CategoryId" = (SELECT "Id" FROM "LogCategories" WHERE "Name" = '教育訓練' LIMIT 1) 
                THEN 4  -- 管理積分項目
            WHEN "CategoryId" = (SELECT "Id" FROM "LogCategories" WHERE "Name" = '其他事項' LIMIT 1) 
                THEN 5  -- 核心職能積分項目
            ELSE "CategoryId"
        END
        WHERE "CategoryId" IN (
            SELECT "Id" FROM "LogCategories" 
            WHERE "Name" IN ('生產作業', '品質檢驗', '設備維護', '改善提案', '教育訓練', '其他事項')
        );
        
        -- 記錄遷移日誌
        RAISE NOTICE '工作日誌分類數據遷移完成：舊分類已更新為積分項目分類';
    END IF;
END $$;

-- 清除舊的分類數據
DELETE FROM "LogCategories" WHERE "Id" IN (1,2,3,4,5,6);

-- 插入新的工作日誌分類（與積分項目分類一致）
INSERT INTO "LogCategories" ("Id", "Name", "Color") VALUES
(1, '一般積分項目', '#10B981'),
(2, '品質工程積分項目', '#3B82F6'),
(3, '專業積分項目', '#8B5CF6'),
(4, '管理積分項目', '#F59E0B'),
(5, '核心職能積分項目', '#EF4444')
ON CONFLICT ("Id") DO UPDATE SET
    "Name" = EXCLUDED."Name",
    "Color" = EXCLUDED."Color";

-- 插入積分類別（與工作日誌分類保持一致）
INSERT INTO "PointsCategories" ("Id", "Name", "Type", "Description", "Multiplier") VALUES
(1, '一般積分項目', 'general', '基本工作項目', 1.0),
(2, '品質工程積分項目', 'quality', '品質工程相關項目', 1.0),
(3, '專業積分項目', 'professional', '技術專業項目', 1.0),
(4, '管理積分項目', 'management', '管理職能項目', 1.0),
(5, '核心職能積分項目', 'core', '全體適用核心職能', 1.0)
ON CONFLICT ("Id") DO UPDATE SET
    "Name" = EXCLUDED."Name",
    "Type" = EXCLUDED."Type",
    "Description" = EXCLUDED."Description";

-- 先創建CategoryName的唯一約束（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_categoryname'
    ) THEN
        ALTER TABLE "StandardSettings" ADD CONSTRAINT unique_categoryname UNIQUE ("CategoryName");
    END IF;
EXCEPTION
    WHEN duplicate_table THEN
        -- 約束已存在，忽略錯誤
        NULL;
END $$;

-- 使用安全的插入方式插入標準設定資料
DO $$
BEGIN
    -- 核心職能積分
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '誠信正直', 5, 'core', 'checkbox', '核心職能 - 誠信正直', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '誠信正直');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '創新效率', 5, 'core', 'number', '核心職能 - 創新效率', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '創新效率');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '卓越品質', 5, 'core', 'number', '核心職能 - 卓越品質', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '卓越品質');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '專業服務', 5, 'core', 'number', '核心職能 - 專業服務', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '專業服務');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '團隊合作', 5, 'core', 'number', '核心職能 - 團隊合作', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '團隊合作');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '學習成長', 5, 'core', 'number', '核心職能 - 學習成長', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '學習成長');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '客戶滿意度', 5, 'core', 'number', '核心職能 - 客戶滿意度', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '客戶滿意度');

    -- 一般積分
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '刀具五金準備', 8, 'general', 'checkbox', '一般積分 - 刀具五金準備', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '刀具五金準備');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '定時巡機檢驗', 8, 'general', 'checkbox', '一般積分 - 定時巡機檢驗', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '定時巡機檢驗');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '生產損耗率', 5, 'general', 'checkbox', '一般積分 - 生產損耗率', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '生產損耗率');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '工具回收歸位', 0.3, 'general', 'number', '一般積分 - 工具回收歸位', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '工具回收歸位');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '清理機台', 1, 'general', 'number', '一般積分 - 清理機台', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '清理機台');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '機台運作正常', 0.3, 'general', 'number', '一般積分 - 機台運作正常', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '機台運作正常');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '製程巡檢單', 0.3, 'general', 'number', '一般積分 - 製程巡檢單', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '製程巡檢單');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '提出改善方案', 0.4, 'general', 'number', '一般積分 - 提出改善方案', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '提出改善方案');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '完成改善方案', 0.8, 'general', 'number', '一般積分 - 完成改善方案', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '完成改善方案');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '工作日誌', 0.1, 'general', 'number', '一般積分 - 工作日誌', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '工作日誌');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '學習型組織', 1, 'general', 'number', '一般積分 - 學習型組織', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '學習型組織');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '基本區域打掃', 2, 'general', 'checkbox', '一般積分 - 基本區域打掃', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '基本區域打掃');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '安全檢查', 1, 'general', 'number', '一般積分 - 安全檢查', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '安全檢查');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '設備保養', 2, 'general', 'number', '一般積分 - 設備保養', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '設備保養');

    -- 管理積分
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '下屬工作日誌', 0.5, 'management', 'number', '管理積分 - 下屬工作日誌', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '下屬工作日誌');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '下屬積分達標', 3, 'management', 'number', '管理積分 - 下屬積分達標', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '下屬積分達標');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '稽核SOP', 2, 'management', 'number', '管理積分 - 稽核SOP', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '稽核SOP');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '教育訓練', 3, 'management', 'number', '管理積分 - 教育訓練', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '教育訓練');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '幹部會議', 1, 'management', 'checkbox', '管理積分 - 幹部會議', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '幹部會議');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '績效面談', 2, 'management', 'number', '管理積分 - 績效面談', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '績效面談');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '團隊建設', 5, 'management', 'number', '管理積分 - 團隊建設', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '團隊建設');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '跨部門協調', 3, 'management', 'number', '管理積分 - 跨部門協調', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '跨部門協調');

    -- 專業積分
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '凸輪改機', 1, 'professional', 'number', '專業積分 - 凸輪改機', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '凸輪改機');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT 'CNC改機', 1, 'professional', 'number', '專業積分 - CNC改機', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = 'CNC改機');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT 'CNC編碼', 1, 'professional', 'number', '專業積分 - CNC編碼', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = 'CNC編碼');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '零件2D製圖', 1, 'professional', 'number', '專業積分 - 零件2D製圖', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '零件2D製圖');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '零件3D製圖', 1, 'professional', 'number', '專業積分 - 零件3D製圖', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '零件3D製圖');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '首件檢驗', 3, 'professional', 'number', '專業積分 - 首件檢驗', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '首件檢驗');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '治具設計', 1, 'professional', 'number', '專業積分 - 治具設計', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '治具設計');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '工藝改善', 4, 'professional', 'number', '專業積分 - 工藝改善', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '工藝改善');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '技術文件編寫', 2, 'professional', 'number', '專業積分 - 技術文件編寫', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '技術文件編寫');

    -- 品質積分
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT 'ISO外部稽核', 4, 'general', 'checkbox', '品質積分 - ISO外部稽核', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = 'ISO外部稽核');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '抽檢驗收', 0.2, 'general', 'number', '品質積分 - 抽檢驗收', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '抽檢驗收');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '進料檢驗', 0.4, 'general', 'number', '品質積分 - 進料檢驗', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '進料檢驗');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '包裝出貨', 0.3, 'general', 'number', '品質積分 - 包裝出貨', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '包裝出貨');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '外觀產品全檢', 0.5, 'general', 'number', '品質積分 - 外觀產品全檢', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '外觀產品全檢');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '庫存盤點', 8, 'general', 'checkbox', '品質積分 - 庫存盤點', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '庫存盤點');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '客戶投訴處理', 2, 'general', 'number', '品質積分 - 客戶投訴處理', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '客戶投訴處理');

    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "InputType", "Description", "IsActive")
    SELECT '品質改善提案', 3, 'general', 'number', '品質積分 - 品質改善提案', true
    WHERE NOT EXISTS (SELECT 1 FROM "StandardSettings" WHERE "CategoryName" = '品質改善提案');
END $$;

-- 安全地重置序列
DO $$
BEGIN
    -- 重置Departments序列
    IF EXISTS (SELECT 1 FROM "Departments") THEN
        PERFORM setval('"Departments_Id_seq"', (SELECT MAX("Id") FROM "Departments"));
    END IF;

    -- 重置Employees序列
    IF EXISTS (SELECT 1 FROM "Employees") THEN
        PERFORM setval('"Employees_Id_seq"', (SELECT MAX("Id") FROM "Employees"));
    END IF;

    -- 重置LogCategories序列
    IF EXISTS (SELECT 1 FROM "LogCategories") THEN
        PERFORM setval('"LogCategories_Id_seq"', (SELECT MAX("Id") FROM "LogCategories"));
    END IF;

    -- 重置PointsCategories序列
    IF EXISTS (SELECT 1 FROM "PointsCategories") THEN
        PERFORM setval('"PointsCategories_Id_seq"', (SELECT MAX("Id") FROM "PointsCategories"));
    END IF;

    -- 重置StandardSettings序列
    IF EXISTS (SELECT 1 FROM "StandardSettings") THEN
        PERFORM setval('"StandardSettings_Id_seq"', (SELECT MAX("Id") FROM "StandardSettings"));
    END IF;

    -- 重置PointsEntries序列
    IF EXISTS (SELECT 1 FROM "PointsEntries") THEN
        PERFORM setval('"PointsEntries_Id_seq"', (SELECT MAX("Id") FROM "PointsEntries"));
    END IF;

    -- 重置WorkLogs序列
    IF EXISTS (SELECT 1 FROM "WorkLogs") THEN
        PERFORM setval('"WorkLogs_Id_seq"', (SELECT MAX("Id") FROM "WorkLogs"));
    END IF;

    -- 重置FileAttachments序列
    IF EXISTS (SELECT 1 FROM "FileAttachments") THEN
        PERFORM setval('"FileAttachments_Id_seq"', (SELECT MAX("Id") FROM "FileAttachments"));
    END IF;

    -- 重置TargetSettings序列
    IF EXISTS (SELECT 1 FROM "TargetSettings") THEN
        PERFORM setval('"TargetSettings_Id_seq"', (SELECT MAX("Id") FROM "TargetSettings"));
    END IF;

    -- 重置CalculationRules序列
    IF EXISTS (SELECT 1 FROM "CalculationRules") THEN
        PERFORM setval('"CalculationRules_Id_seq"', (SELECT MAX("Id") FROM "CalculationRules"));
    END IF;

    -- *** 重置Notifications序列 (新增) ***
    IF EXISTS (SELECT 1 FROM "Notifications") THEN
        PERFORM setval('"Notifications_Id_seq"', (SELECT MAX("Id") FROM "Notifications"));
    END IF;
END $$;

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS "IX_Employees_DepartmentId" ON "Employees" ("DepartmentId");
CREATE INDEX IF NOT EXISTS "IX_PointsEntries_EmployeeId" ON "PointsEntries" ("EmployeeId");
CREATE INDEX IF NOT EXISTS "IX_PointsEntries_StandardId" ON "PointsEntries" ("StandardId");
CREATE INDEX IF NOT EXISTS "IX_PointsEntries_EntryDate" ON "PointsEntries" ("EntryDate");
CREATE INDEX IF NOT EXISTS "IX_WorkLogs_EmployeeId" ON "WorkLogs" ("EmployeeId");
CREATE INDEX IF NOT EXISTS "IX_WorkLogs_LogDate" ON "WorkLogs" ("LogDate");
CREATE INDEX IF NOT EXISTS "IX_FileAttachments_EntityType_EntityId" ON "FileAttachments" ("EntityType", "EntityId");

-- *** 通知系統相關索引 (新增) ***
CREATE INDEX IF NOT EXISTS "IX_Notifications_UserId" ON "Notifications" ("UserId");
CREATE INDEX IF NOT EXISTS "IX_Notifications_IsRead" ON "Notifications" ("IsRead");
CREATE INDEX IF NOT EXISTS "IX_Notifications_CreatedAt" ON "Notifications" ("CreatedAt");
CREATE INDEX IF NOT EXISTS "IX_Notifications_Type" ON "Notifications" ("Type");
CREATE INDEX IF NOT EXISTS "IX_Notifications_Priority" ON "Notifications" ("Priority");

-- 插入通知系統測試數據 (可選)
DO $$
BEGIN
    -- 如果有員工數據，插入測試通知
    IF EXISTS (SELECT 1 FROM "Employees" WHERE "Role" IN ('manager', 'admin', 'president', 'boss')) THEN
        INSERT INTO "Notifications" ("UserId", "Title", "Content", "Type", "Priority") 
        SELECT e."Id", '系統初始化完成', '積分管理系統已成功初始化並整合通知功能', 'system_notice', 'normal'
        FROM "Employees" e 
        WHERE e."Role" IN ('manager', 'admin', 'president', 'boss') AND e."IsActive" = true
        LIMIT 5;  -- 限制測試數據數量
        
        RAISE NOTICE '已為管理層帳號創建測試通知';
    ELSE
        RAISE NOTICE '暫無管理層帳號，跳過測試通知創建';
    END IF;
END $$;

-- 驗證資料庫結構和數據
DO $$
DECLARE
    table_count INTEGER;
    standard_count INTEGER;
    employee_count INTEGER;
    notification_count INTEGER;
BEGIN
    -- 檢查表數量
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    -- 檢查標準設定數量
    SELECT COUNT(*) INTO standard_count FROM "StandardSettings";

    -- 檢查員工數量
    SELECT COUNT(*) INTO employee_count FROM "Employees";

    -- 檢查通知數量
    SELECT COUNT(*) INTO notification_count FROM "Notifications";

    RAISE NOTICE '=== 資料庫初始化完成 (包含通知系統) ===';
    RAISE NOTICE '表格數量: %', table_count;
    RAISE NOTICE '標準設定數量: %', standard_count;
    RAISE NOTICE '員工數量: % (已清除所有員工數據)', employee_count;
    RAISE NOTICE '通知數量: %', notification_count;
    RAISE NOTICE '=== 系統已重置為乾淨狀態，可使用註冊功能創建新帳號 ===';
    RAISE NOTICE '=== 通知系統已整合完成，支援完整功能 ===';
    RAISE NOTICE '=== 可以安全重複執行此腳本 ===';
END $$;

-- 顯示創建結果
SELECT 'Database initialization with notification system completed successfully!' as status;
SELECT 'Tables created (including Notifications):' as info;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 顯示標準設定數量
SELECT 'Standard settings count:' as info, COUNT(*) as count FROM "StandardSettings";

-- 顯示員工數量
SELECT 'Employees count:' as info, COUNT(*) as count FROM "Employees";

-- 顯示工作日誌數量
SELECT 'WorkLogs count:' as info, COUNT(*) as count FROM "WorkLogs";

-- 顯示檔案附件數量
SELECT 'FileAttachments count:' as info, COUNT(*) as count FROM "FileAttachments";

-- *** 顯示通知數量 (新增) ***
SELECT 'Notifications count:' as info, COUNT(*) as count FROM "Notifications";

-- 檢查通知表結構
SELECT 'Notifications table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'Notifications'
ORDER BY ordinal_position;

-- 檢查WorkLogs表結構
SELECT 'WorkLogs table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'WorkLogs'
ORDER BY ordinal_position; 
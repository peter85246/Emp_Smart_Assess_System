-- 積分管理系統資料庫初始化腳本 V2.0 (完整版)
-- 功能：自動遷移、創建表格、插入184項積分數據
-- 本版本新增：子分類支援、部門權限控制、智能遷移
-- 建立日期：2025-01-19
-- 更新日期：2025-01-28
-- 項目總數：184項 (一般80項 + 專業79項 + 管理20項 + 臨時3項 + 雜項2項)

-- =================================================================
-- 第一階段：智能資料庫結構遷移
-- =================================================================

DO $$
BEGIN
    RAISE NOTICE '=== 積分管理系統資料庫初始化 V2.0 (完整版) ===';
    RAISE NOTICE '🔄 智能遷移資料庫結構';
    RAISE NOTICE '📊 支援完整的 184 項積分項目';
END $$;

-- 為 StandardSettings 表添加缺少的欄位（智能遷移）
DO $$
BEGIN
    -- 添加 SubCategory 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'StandardSettings' AND column_name = 'SubCategory'
    ) THEN
        ALTER TABLE "StandardSettings" ADD COLUMN "SubCategory" VARCHAR(50);
        RAISE NOTICE '✅ 已添加 SubCategory 欄位';
    END IF;

    -- 添加 DepartmentFilter 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'StandardSettings' AND column_name = 'DepartmentFilter'
    ) THEN
        ALTER TABLE "StandardSettings" ADD COLUMN "DepartmentFilter" VARCHAR(50);
        RAISE NOTICE '✅ 已添加 DepartmentFilter 欄位';
    END IF;

    -- 添加 Unit 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'StandardSettings' AND column_name = 'Unit'
    ) THEN
        ALTER TABLE "StandardSettings" ADD COLUMN "Unit" VARCHAR(20);
        RAISE NOTICE '✅ 已添加 Unit 欄位';
    END IF;

    -- 添加 StepValue 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'StandardSettings' AND column_name = 'StepValue'
    ) THEN
        ALTER TABLE "StandardSettings" ADD COLUMN "StepValue" DECIMAL(3,2) DEFAULT 1.0;
        RAISE NOTICE '✅ 已添加 StepValue 欄位';
    END IF;

    -- 添加 SortOrder 欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'StandardSettings' AND column_name = 'SortOrder'
    ) THEN
        ALTER TABLE "StandardSettings" ADD COLUMN "SortOrder" INTEGER DEFAULT 0;
        RAISE NOTICE '✅ 已添加 SortOrder 欄位';
    END IF;

    RAISE NOTICE '🔄 資料庫結構遷移完成';
END $$;

-- 清除現有資料（保留結構）
DO $$
BEGIN
    RAISE NOTICE '🧹 清理現有數據...';
END $$;

TRUNCATE TABLE "PointsEntries" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "StandardSettings" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "PointsCategories" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "LogCategories" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Notifications" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Employees" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "Departments" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "FileAttachments" RESTART IDENTITY CASCADE;

-- 創建基礎表格（如果不存在）
CREATE TABLE IF NOT EXISTS "Departments" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Description" VARCHAR(500),
    "ManagerId" INTEGER,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Employees" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(50) NOT NULL,
    "EmployeeNumber" VARCHAR(20) NOT NULL UNIQUE,
    "Username" VARCHAR(50) UNIQUE NOT NULL,
    "Password" VARCHAR(255) NOT NULL,
    "Email" VARCHAR(100),
    "Phone" VARCHAR(20),
    "DepartmentId" INTEGER REFERENCES "Departments"("Id"),
    "Position" VARCHAR(100),
    "Level" VARCHAR(50) DEFAULT 'employee',
    "Role" VARCHAR(50) DEFAULT 'employee',
    "IsActive" BOOLEAN DEFAULT TRUE,
    "HireDate" TIMESTAMP,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PointsCategories" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Type" VARCHAR(50) NOT NULL,
    "Description" VARCHAR(500),
    "Multiplier" DECIMAL(3,2) DEFAULT 1.0,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StandardSettings" (
    "Id" SERIAL PRIMARY KEY,
    "CategoryName" VARCHAR(100) NOT NULL,
    "PointsValue" DECIMAL(6,2) NOT NULL,
    "PointsType" VARCHAR(50) NOT NULL DEFAULT 'general',
    "SubCategory" VARCHAR(50),
    "DepartmentFilter" VARCHAR(50),
    "InputType" VARCHAR(20) DEFAULT 'number',
    "Unit" VARCHAR(20),
    "StepValue" DECIMAL(3,2) DEFAULT 1.0,
    "Description" TEXT,
    "SortOrder" INTEGER DEFAULT 0,
    "CalculationFormula" TEXT,
    "DepartmentId" INTEGER REFERENCES "Departments"("Id"),
    "PositionId" INTEGER,
    "IsActive" BOOLEAN DEFAULT TRUE,
    "ParentId" INTEGER REFERENCES "StandardSettings"("Id"),
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 智能添加StandardSettings表的額外欄位（相容database_init.sql）
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

    -- 添加DepartmentId欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'StandardSettings' AND column_name = 'DepartmentId'
    ) THEN
        ALTER TABLE "StandardSettings" ADD COLUMN "DepartmentId" INTEGER REFERENCES "Departments"("Id");
    END IF;

    -- 添加ParentId欄位
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'StandardSettings' AND column_name = 'ParentId'
    ) THEN
        ALTER TABLE "StandardSettings" ADD COLUMN "ParentId" INTEGER REFERENCES "StandardSettings"("Id");
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

-- 5. 創建積分記錄表 (整合database_init.sql功能)
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

-- 11. 創建通知系統表
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

-- 初始化基礎資料
DO $$
BEGIN
    RAISE NOTICE '=== 開始初始化積分管理系統資料庫 V2.0 (184項) ===';
    
    -- 插入部門資料
    INSERT INTO "Departments" ("Id", "Name", "Description") VALUES
    (1, '製造部', '負責產品製造生產'),
    (2, '品質工程部', '負責品質管控和工程技術'),
    (3, '管理部', '負責公司管理事務'),
    (4, '業務部', '負責客戶關係和業務拓展')
    ON CONFLICT ("Id") DO UPDATE SET
        "Name" = EXCLUDED."Name",
        "Description" = EXCLUDED."Description";

    -- 插入積分類別（按照184項分類架構）
    INSERT INTO "PointsCategories" ("Id", "Name", "Type", "Description", "Multiplier") VALUES
    (1, '一般積分項目', 'general', '基本工作項目（製造部門、品質工程部門、共同內容、核心職能項目）', 1.0),
    (2, '專業積分項目', 'professional', '專業技術項目（專業技能項目、專業職能項目）', 1.0),
    (3, '管理積分項目', 'management', '管理職能項目', 1.0),
    (4, '臨時工作積分項目', 'temporary', '臨時性工作項目', 1.0),
    (5, '雜項事件', 'misc', '其他事件', 1.0)
    ON CONFLICT ("Id") DO UPDATE SET
        "Name" = EXCLUDED."Name",
        "Type" = EXCLUDED."Type",
        "Description" = EXCLUDED."Description";

    RAISE NOTICE '基礎資料初始化完成';
    
    -- ==========================================
    -- 一般積分項目 - 製造部門 (22項)
    -- ==========================================
    
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "SubCategory", "DepartmentFilter", "InputType", "Unit", "StepValue", "Description", "SortOrder", "IsActive")
    VALUES 
    ('刀具五金準備', 8, 'general', 'manufacturing', '1', 'checkbox', '月', 1.0, '初期8積分/月(技術士以上)(上機日前未準備完成，每單扣1積分)，參照生產履歷，沒有建立則須建立，依生產履歷驗收', 1, true),
    ('定時巡機檢驗', 8, 'general', 'manufacturing', '1', 'checkbox', '月', 1.0, '基本每兩小時/次，特殊件巡檢依主管設定，確實做到每月8積分，每款於下個製程進料3個工作天抽到異常扣0.5積分', 2, true),
    ('生產損耗率', 5, 'general', 'manufacturing', '1', 'checkbox', '月', 1.0, '月生產損耗率2%以下，5積分/月(每多0.5%扣0.5積分)，依工單材料設定(樣品單不算在內)', 3, true),
    ('刀具損耗', 2, 'general', 'manufacturing', '1', 'select', '單', 0.5, '每量產七個工作天內之訂單，銅&鋁類每單低於1千元=2積分，低於2千元=1積分，超過2千=0積分，再超過每1千元扣0.5積分，每月累計計分', 4, true),
    ('工具回收歸位', 0.3, 'general', 'manufacturing', '1', 'number', '台', 0.1, '機台上無殘留刀具、五金、工具0.3積分/台，發現機台上有殘留或未填寫記錄者得0.1積分/台，被發現者扣0.3積分/台', 5, true),
    ('生產優化', 5, 'general', 'manufacturing', '1', 'number', '次', 1.0, '生產效率提升10%(依生產履歷)，同等成本下降，每產品5積分(每三個月/次或主管安排)，超過一日優化時間扣2積分/日', 6, true),
    ('洗料&脫油', 0.3, 'general', 'manufacturing', '1', 'number', '桶', 0.1, '每款基本25公斤內／桶0.3積分(含分料與清潔)，不可刻意分多桶，抓到每桶扣0.6積分', 7, true),
    ('清理機台', 1, 'general', 'manufacturing', '1', 'select', '台', 0.5, '25型以上(1積分／台)，20型以下(0.5積分／台)，清理不完整重複清洗不算積分', 8, true),
    ('磁力研磨', 0.5, 'general', 'manufacturing', '1', 'number', '桶', 0.1, '每款基本10公斤(不含水)/桶得0.5積分(含分料與清潔)，不可刻意分多桶，抓到每桶扣1積分', 9, true),
    ('改機明細表', 3, 'general', 'manufacturing', '1', 'checkbox', '月', 1.0, '確實提供每月改機明細表(3積分/月)(隔月10號前)(超過積分減半)', 10, true),
    ('材料進料檢查', 0.2, 'general', 'manufacturing', '1', 'number', '款', 0.1, '進料檢驗每款0.2積分，須註明誰檢查，有問題取消該積分，主要抽驗外觀尺寸／把', 11, true),
    ('生產交期達成', 0.4, 'general', 'manufacturing', '1', 'number', '單', 0.1, '生產如期達成每單0.4積分，每超過一工作日扣0.2積分，超過五個工作日以上，每日扣1積分', 12, true),
    ('機台運作正常', 0.3, 'general', 'manufacturing', '1', 'number', '台', 0.1, '量產訂單機台每日正常開機生產0.3積分／台(改機期間不算)，須符合產品生產履歷生產效率與品質要求', 13, true),
    ('製程巡檢單', 0.3, 'general', 'manufacturing', '1', 'number', '台', 0.1, '客戶之定時紀錄(基本2H／次)檢查要求，每日0.3積分／台，確實紀錄圖面重點尺寸', 14, true),
    ('開立委外單', 0.1, 'general', 'manufacturing', '1', 'number', '件', 0.1, '委外處理開立簽單，每件0.1積分，註明清楚注意事項，並提供相關檢治具', 15, true),
    ('開關空壓機', 0.1, 'general', 'manufacturing', '1', 'number', '次', 0.1, '依照空壓機開機&關機SOP作業，並做紀錄得0.1積分/次，未關機時則需要定時排水', 16, true),
    ('水洗研磨', 0.4, 'general', 'manufacturing', '1', 'number', '桶', 0.1, '每款基本15公斤(不含水)/桶得0.4積分(含分料與清潔)，不可刻意分多桶，抓到每桶扣0.8積分', 17, true),
    ('廠區地板', 4, 'general', 'manufacturing', '1', 'checkbox', '月', 1.0, '負責廠區清潔人員，經常性地板沒有漏油在地面得4積分/月，當天發現3處以上扣0.4積分/天', 18, true),
    ('加工區地板', 2, 'general', 'manufacturing', '1', 'checkbox', '月', 1.0, '負責加工區清潔人員，經常性地板沒有漏油在地面得2積分/月，當天發現2處以上扣0.2積分/天', 19, true),
    ('提早暖機', 0.1, 'general', 'manufacturing', '1', 'number', '台', 0.1, '經過核可者，每日提早15分鐘以上開啟機台暖機，正在量產之機台0.1積分／台 (第一台0.3積分)', 20, true),
    ('廠區巡視', 0.5, 'general', 'manufacturing', '1', 'number', '次', 0.1, '巡視廠區0.5積分／次，每次巡視項目為機台稼動、地面&機台表面油汙、冷氣風扇是否合乎規定、趕貨機台是否正常運作、廠區安全…等狀況，發現問題需回報並立即處理！（每日最多兩次得分）', 21, true),
    ('下班巡查', 0.5, 'general', 'manufacturing', '1', 'number', '日', 0.1, '巡查廠區是否有機台應關而未關、續開是否有料、全關機是否關閉空壓機及排風扇＆風扇、空調是否確實關閉、對外門窗是否確認關閉、全公司通道＆廁所是否關燈、是否有危險狀況排除…等，0.5積分／日，發現問題需即時回報並立即處理！', 22, true);
    
    -- ==========================================
    -- 一般積分項目 - 品質工程部門 (15項)
    -- ==========================================
    
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "SubCategory", "DepartmentFilter", "InputType", "Unit", "StepValue", "Description", "SortOrder", "IsActive")
    VALUES 
    ('ISO外部稽核', 4, 'general', 'quality_department', '2', 'checkbox', '年', 1.0, '協助處理，得4積分(每年一次)', 23, true),
    ('抽檢驗收', 0.2, 'general', 'quality_department', '2', 'number', '單', 0.1, '自家生產進料或委外表面處理前，每單0.2積分(32PCS抽檢)(填寫進料紀錄)，發現異常須即時反應給部門主管', 24, true),
    ('進料檢驗', 0.4, 'general', 'quality_department', '2', 'number', '單', 0.1, '委外生產確實依圖面紀錄驗收(基本2~5顆／單進貨)得0.4積分，可至廠商處直接驗收，若尺寸超過10個以上得0.8積分/單，須使用2.5D投影機額外得0.5積分/單', 25, true),
    ('包裝出貨', 0.3, 'general', 'quality_department', '2', 'number', '單', 0.1, '包裝出貨每單0.3積分(含倉庫撿貨出庫)，含基本包裝一箱，超過一箱每箱0.1積分，須紀錄相關資訊，如單重、數量／袋、箱數…等，出貨為優先考量', 26, true),
    ('外觀產品全檢', 0.5, 'general', 'quality_department', '2', 'number', '200PCS', 0.1, '外觀件產品全檢，每200PCS(+15%)=0.5積分，超出部分計0.1積分，由異常部門預算扣除，首次設定全檢辦法者得1積分', 27, true),
    ('單一位置全檢', 0.1, 'general', 'quality_department', '2', 'number', '300PCS', 0.1, '異常產品全檢，每300PCS(+15%)=0.1積分，由異常部門預算扣除，首次設定全檢辦法者得1積分', 28, true),
    ('庫存管理', 0.2, 'general', 'quality_department', '2', 'number', '單', 0.1, '每單庫存或餘料入庫0.2積分，數量與位置紀錄並提供給管理部門', 29, true),
    ('庫存盤點', 8, 'general', 'quality_department', '2', 'checkbox', '次', 1.0, '每半年庫存盤點，8積分／次(依盤點人數與貢獻分配)，提出盤點表簽名確認', 30, true),
    ('震動盤篩檢', 1, 'general', 'quality_department', '2', 'select', '萬個', 0.5, '全檢內孔，震動盤目視檢查，每2萬個=1積分；篩檢連體，每2萬個=0.5積分；不確實檢則取消', 31, true),
    ('品質需求全檢', 0.5, 'general', 'quality_department', '2', 'number', '批', 0.1, '每600(+15%)個0.5積分，最低數量給0.1積分，如：螺絲對鎖，檢查內外牙的功能性；被抓到該項目有不良，則取消得分，且須負擔相關責任', 32, true),
    ('客戶退貨', 0.5, 'general', 'quality_department', '2', 'number', '單', 0.1, '出貨後，超過每月品質政策目標，每多一單扣0.5積分', 33, true),
    ('達成品質政策', 6, 'general', 'quality_department', '2', 'checkbox', '月', 1.0, '當月達成加6積分，若因品質部門導致未達到無積分，因其他部門未達成每單扣0.5積分(未去追蹤並做好監督)，團隊積分', 34, true),
    ('出貨留樣', 0.3, 'general', 'quality_department', '2', 'number', '單', 0.1, '每單生產品素材留樣2~5顆，後續表面處理品亦留樣2~5顆，留存至生管指定處，並做紀錄得0.3積分／單', 35, true),
    ('指導作業流程', 2, 'general', 'quality_department', '2', 'number', '小時', 1.0, '主管或幹部指導下屬SOP作業流程得2積分(一小時)／被教導者（須完成TB-07員工教育訓練資歷表），被教導者得0.3積分／半小時，每項目最多2次', 36, true),
    ('出貨事項', 0.2, 'general', 'quality_department', '2', 'number', '單', 0.1, '出貨事項作業得0.2積分/單，須完成主管幹部交代作業之流程，並紀錄呈給主管幹部；不確實者取消該積分', 37, true);
    
    -- ==========================================
    -- 一般積分項目 - 共同內容 (39項)
    -- ==========================================
    
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "SubCategory", "DepartmentFilter", "InputType", "Unit", "StepValue", "Description", "SortOrder", "IsActive")
    VALUES 
    ('開車外送', 0.5, 'general', 'common', '1,2,3,4', 'number', '次', 0.1, '一次來回距離，每10公里(0.5積分)，或設定點固定積分(如送慶邦0.7積分)，依google地圖合法駕馭', 38, true),
    ('提出改善方案', 0.4, 'general', 'common', '1,2,3,4', 'number', '案', 0.1, '有效方案0.4積分/案，經管理部門審核通過並公告', 39, true),
    ('完成改善方案', 0.8, 'general', 'common', '1,2,3,4', 'number', '案', 0.1, '完成方案0.8積分/案(半年追蹤維持，得0.4積分)', 40, true),
    ('工作日誌', 0.1, 'general', 'common', '1,2,3,4', 'number', '天', 0.1, '每天0.1積分，不確實不給分，積分主要參考項目(勿偽造文書)', 41, true),
    ('學習型組織', 1, 'general', 'common', '1,2,3,4', 'number', '2小時', 1.0, '參與學習一堂課(2H)1積分、兩堂課(4H)2積分、三堂課(6H)3積分，以此類推，須繳交報告，每受訓4小時增加一個月服務期', 42, true),
    ('倒垃圾', 0.2, 'general', 'common', '1,2,3,4', 'number', '日', 0.1, '整理全廠需要丟棄的垃圾、裝環保垃圾袋，倒垃圾，0.2積分/日(無收日不算)，不確實無積分', 43, true),
    ('其他交辦事項', 0.2, 'general', 'common', '1,2,3,4', 'number', '件', 0.1, '其他老闆或主管交辦事項(基本0.2積分/件)，會發布給個人', 44, true),
    ('負責公司開門', 0.1, 'general', 'common', '1,2,3,4', 'number', '日', 0.1, '每日0.1積分，但須提前開門不造成他人遲到，造成他人遲到扣0.2積分/次', 45, true),
    ('外銷打包', 0.6, 'general', 'common', '1,2,3,4', 'number', '棧板', 0.1, '每棧板0.6積分，須完整打包好', 46, true),
    ('修理公司車', 0.2, 'general', 'common', '1,2,3,4', 'number', '次', 0.1, '每次0.2積分(基本)，看項目給分', 47, true),
    ('清潔公司車', 1, 'general', 'common', '1,2,3,4', 'number', '台/月', 1.0, '內部清潔＆外部清洗，每次1積分/台/月；委外清潔不算，主管負責稽核', 48, true),
    ('替換燈泡', 0.2, 'general', 'common', '1,2,3,4', 'number', '個', 0.1, '每一燈架0.2積分', 49, true),
    ('客訪招待服務', 0.2, 'general', 'common', '1,2,3,4', 'number', '次', 0.1, '每次0.2積分，要負責收&清潔，未做確實者扣0.2積分', 50, true),
    ('客訪泡咖啡', 0.2, 'general', 'common', '1,2,3,4', 'number', '次', 0.1, '每次0.2積分(基本一壺)，要負責收&清潔，未做確實者扣0.2積分', 51, true),
    ('舉辦團體活動', 1, 'general', 'common', '1,2,3,4', 'number', '次', 1.0, '提出計畫書與預算，經審核通過1積分/次', 52, true),
    ('舉辦員工旅遊', 5, 'general', 'common', '1,2,3,4', 'select', '次', 1.0, '(國外每次13積分)(國內每次5積分)主辦員工旅遊之內容，依共同參與者分配，完成計畫當月給分', 53, true),
    ('基本區域打掃', 2, 'general', 'common', '1,2,3,4', 'select', '月', 1.0, '每週打掃2積分/月(未分配沒有)(每日打掃區域者7積分/月)，未做確實者扣0.5積分/次', 54, true),
    ('9930政策達標', 5, 'general', 'common', '1,2,3,4', 'checkbox', '月', 1.0, '【99%良率、30天交貨】，上月達標，下月得5積分，團體積分獎勵', 55, true),
    ('培訓政策', 2, 'general', 'common', '1,2,3,4', 'number', '2小時', 1.0, '受培訓者須遵守教育訓練管理辦法，延長服務期限，每受培訓2小時／培訓費3000元，增加一個月服務期限，而每被培訓2小時可得2積分之獎勵(繳交學習報告)', 56, true),
    ('競業條款', 0, 'general', 'common', '1,2,3,4', 'checkbox', '月', 1.0, '在公司聘僱期間不得對外從事相關工作，若有必須由本司代理，依公司工作積分制度給予，違者小過乙支', 57, true),
    ('其它機台操作', 0.5, 'general', 'common', '1,2,3,4', 'select', '次', 0.5, '其它手動機台(個人經操作承認過方可)，有改過(0.5積分)，沒改過(1積分)', 58, true),
    ('TQM品質管理', 0.5, 'general', 'common', '1,2,3,4', 'number', '件', 0.1, '每道流程做好進料抽檢，抽檢到不良品超過1%，退回上階段責任者(進料方)處理可得0.5積分/件(不重複)，以確保TQM之執行順暢，達到不良品不流入下一關卡的精神', 59, true),
    ('代售淘汰品', 0.2, 'general', 'common', '1,2,3,4', 'number', '次', 0.1, '每代公司月銷售實收一千元得0.2積分，基本售價由公司決定，超出公司售價部份，每實收超過250元，可額外得0.2積分！', 60, true),
    ('顧機台', 0.2, 'general', 'common', '1,2,3,4', 'number', '台', 0.1, '協助顧機台、上下料、檢查，簡易排除異常、異常回覆，依設備可產出數量設定積分，空餘時間得兼做其他項目；中碳硬度以上材料基本0.6積分/台，塑材基本0.5積分/台，鋁材基本0.4積分/台，白鐵材基本0.3積分/台，鐵材基本0.2積分/台，銅材基本0.1積分/台，沒顧好不給分，以四小時計', 61, true),
    ('跑郵局/銀行', 0.1, 'general', 'common', '1,2,3,4', 'number', '次', 0.1, '寄送或是繳費，每間0.1積分，抓準時間去可以節省時間', 62, true),
    ('買東西', 0.3, 'general', 'common', '1,2,3,4', 'number', '次', 0.1, '公司臨時需要外購，每次0.3積分，外出前須經主管許可；辦公&衛生用品線上購物0.5積分/月', 63, true),
    ('幫狗清潔', 1, 'general', 'common', '1,2,3,4', 'number', '次', 1.0, '每兩週/次，每隻1積分，包含洗淨、擦拭、吹乾、洗碗、換飲用水', 64, true),
    ('溜狗', 0.4, 'general', 'common', '1,2,3,4', 'number', '次', 0.1, '每日2次(早上&下午)，兩隻狗0.4積分/次，包含綁繩、帶去大小便(大便要清理)、每次至少一公里、回來換飲用水', 65, true),
    ('提出工作內容', 1, 'general', 'common', '1,2,3,4', 'number', '案', 1.0, '提出表單上未有的工作內容(超過30分鐘或特殊項目)，並提供相關資訊，經管理部成立1積分/案，須於每月月底前提交，否則當月此工作內容將由主管自由給分或不給分', 66, true),
    ('機台設備換油', 0.5, 'general', 'common', '1,2,3,4', 'select', '台', 0.2, '大台(40型以上)1積分、中台(25型以上)0.7積分、小台(20型)以下0.5積分，如有更換材質須要先清潔後才能換油', 67, true),
    ('清切削屑', 0.1, 'general', 'common', '1,2,3,4', 'select', '台', 0.1, '銅屑0.1積分/台、鐵屑0.2積分/台、鋁屑0.3積分/台，包含做好回收的項目，時間到未清理、未做好回收扣0.3積分/台', 68, true),
    ('買拜拜用品', 0.3, 'general', 'common', '1,2,3,4', 'select', '次', 0.1, '供品0.3積分/次(含擺放)，訂熱食0.3/次(含確認用餐人數)，取餐0.3/次，煮飯0.2積分/次，準備的人有福報', 69, true),
    ('讀書心得', 0.4, 'general', 'common', '1,2,3,4', 'number', '本', 0.1, '公司指定書籍&時間，閱讀後繳交讀書心得並口述分享0.4積分/本', 70, true),
    ('代理工作', 1.2, 'general', 'common', '1,2,3,4', 'number', '倍', 0.1, '不同部門請假代理，領取被代理人員工作內容的1.2倍積分(共同內容不含)，如：外部稽核4積分，代理人可得4.8積分', 71, true),
    ('廠商調查', 2, 'general', 'common', '1,2,3,4', 'number', '件', 1.0, '因委外不良至廠商端確認QC工程圖與遭遇的問題分析與討論有效方案，2積分/件，並做報告給廠商簽名確認後上傳雲端，下次廠商再犯同樣問題依損失狀況扣相對應積分', 72, true),
    ('包裝入庫', 0.2, 'general', 'common', '1,2,3,4', 'number', '包', 0.1, '計數、包裝、貼標籤流程，外徑H8以下，每單10(+/-2)包0.2積分，不足8包0.1積分；外徑超過H8，每單8(+/-2)包0.2積分，不足6包0.1積分含庫存數；長度超過40mm，每單6(+/-1)包0.2積分，不足5包0.1積分含庫存數；長度超過80mm，每單4(+/-1)包0.2積分，不足3包0.1積分含庫存數包裝數量依規範不得有誤，蓋印+記錄單重0.1積分/單；失誤則扣相對應積分', 73, true),
    ('年度送禮', 1, 'general', 'common', '1,2,3,4', 'number', '次', 1.0, '協助管理部整理送禮作業，依據管理部制訂該積分，來計算之', 74, true),
    ('代訂便當', 0.2, 'general', 'common', '1,2,3,4', 'number', '次', 0.1, '協助整理並訂購便當0.2/次，並協助收便當費用。須於每日11點', 75, true),
    ('下午茶訂購', 0.4, 'general', 'common', '1,2,3,4', 'number', '次', 0.1, '負責整理並訂購下午茶福利0.4/次，包含付款、收件', 76, true);

    -- ==========================================
    -- 一般積分項目 - 核心職能項目 (4項)
    -- ==========================================
    
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "SubCategory", "DepartmentFilter", "InputType", "Unit", "StepValue", "Description", "SortOrder", "IsActive")
    VALUES 
    ('誠信正直', 5, 'general', 'core_competency', '1,2,3,4', 'select', '月', 1.0, '1.工作異常改善單1份=1積分，改善工作中的異常狀況(人、事、物) 2.說到做到，承諾主管幹部的事情，皆能如期完成，且符合期待，依照面談表格成立(1積分/件)，最多5積分/月 3.其他和誠信正直有相關之行為，依狀況給分', 77, true),
    ('創新效率', 5, 'general', 'core_competency', '1,2,3,4', 'select', '月', 1.0, '1.超過標準積分110%=5積分、超過100%=3積分、達標90%=1積分) 2.工作成效"比上月"提升15%=5積分、提升10%=3積分、提升5%=1積分) 3.其他與創新效率有相關之行為(如建立SOP)，依狀況給分', 78, true),
    ('卓越品質', 5, 'general', 'core_competency', '1,2,3,4', 'select', '月', 1.0, '1.上月不良率低於1%=5積分、低於1.5%=3積分、低於2%=1積分 2.全檢異常產品三個單=3積分、兩個單=2積分、一個單=1積分(發現未確實追扣3積分/單) 3.其他與卓越品質有相關之行為(如修正SOP)，依狀況給分', 79, true),
    ('專業服務', 3, 'general', 'core_competency', '1,2,3,4', 'select', '月', 1.0, '1.對公司好有效提案3件=3積分、2件=2積分、1件=1積分，最多5積分/月 2.主動進行對公司(同事)好的行為，3件=3積分、2件=2積分、1件=1積分，最多5積分/月 3.其他與專業(主動)服務(行為)有相關之行為，依狀況給分', 80, true);

    RAISE NOTICE '已插入一般積分項目 80項 (製造部門22項 + 品質工程部門15項 + 共同內容39項 + 核心職能項目4項)';
    
    -- ==========================================
    -- 專業積分項目 - 專業技能項目 (31項)
    -- ==========================================
    
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "SubCategory", "DepartmentFilter", "InputType", "Unit", "StepValue", "Description", "SortOrder", "IsActive")
    VALUES 
    ('凸輪改機', 1.5, 'professional', 'technical_skills', '1,2,3,4', 'select', '次', 0.1, '微調(1.5積分)、有改過(3積分)、沒改過(6積分)，含自主檢查&凸輪與配刀，上機預定日未完成改機，每延遲一天每單扣1積分，每單計算一次，需建檔在生產履歷中(1積分)', 81, true),
    ('CNC改機', 1, 'professional', 'technical_skills', '1,2,3,4', 'select', '次', 0.5, '微調(1積分)、有改過(2.5積分)、公司首次(4積分)，含自主檢查&架刀，需建檔在生產履歷中，上機預定日未完成改機，每延遲一天每單扣1積分，每單計算一次，含後續補正', 82, true),
    ('CNC編碼', 0.5, 'professional', 'technical_skills', '1,2,3,4', 'select', '次', 0.5, '微調(0.5積分)、有改過(1積分)、公司首次(4積分)(含自主檢查)，需建檔在指定電腦及雲端硬碟，上機預定日未完成，每延遲一天每單扣1積分，每單計算一次，含後續補正', 83, true),
    ('搓牙機', 1, 'professional', 'technical_skills', '1,2,3,4', 'select', '次', 1.0, '微調(1積分)、有改過(2積分)、沒改過(5積分)，上機預定日未完成，每延遲一天每單扣1積分，每單計算一次', 84, true),
    ('加工機', 1, 'professional', 'technical_skills', '1,2,3,4', 'select', '次', 1.0, '微調(1積分)、有改過(2積分)、沒改過(5積分)，上機預定日未完成，每延遲一天每單扣1積分，每單計算一次', 85, true),
    ('#機台稼動率', 10, 'professional', 'technical_skills', '1,2,3,4', 'checkbox', '月', 1.0, '責任機台當月稼動率7成為基本，超過8成加成10%，超過9成加成20%，如當月專業積分獲得110積分，稼動率有8成，則專業積分額外加11積分，須符合生產履歷之質量與交期不得超出預期，不符合的機台視為無稼動！故障等待原廠維修不列入！', 86, true),
    ('新學機台加給', 1.4, 'professional', 'technical_skills', '1,2,3,4', 'number', '倍', 0.1, '新機進廠/一年內、技術員新學設備或新進人員/半年內，上述改機積分*1.4倍(依進廠/入職當月開始)', 87, true),
    ('首次改配刀', 1.5, 'professional', 'technical_skills', '1,2,3,4', 'number', '次', 0.1, '首次改配刀1.5積分(多人則分配)，建立在生產履歷(每款0.5積分)，於架機完3工作日內建立', 88, true),
    ('完成生產履歷', 1, 'professional', 'technical_skills', '1,2,3,4', 'number', '款', 1.0, '完整一份生產履歷(一款1積分)(一種機台廠牌)(含程式/刀具/五金/其它細節)', 89, true),
    ('刀具壽命設定', 0.5, 'professional', 'technical_skills', '1,2,3,4', 'number', '刀具', 0.1, '刀具壽命設定(每產品所有刀具壽命記錄至生產履歷0.5積分/刀具)(同刀具至少換刀兩次之平均值)', 90, true),
    ('維修或測試', 1, 'professional', 'technical_skills', '1,2,3,4', 'number', '次', 1.0, '維修或測試(基本1積分)，依個案配分(例：銲接1.5積分(符合功能性)、上漆1積分(10坪空間)、維修替換1積分，上述參考)', 91, true),
    ('AOI全檢設定', 2, 'professional', 'technical_skills', '1,2,3,4', 'select', '次', 1.0, 'AOI全檢機設定，首次5積分、有改過(類似產品)2積分、微調1積分，品質&效率須符合，每款參數建檔並上傳雲端', 92, true),
    ('AOI全檢操作', 1, 'professional', 'technical_skills', '1,2,3,4', 'number', '單', 1.0, 'AOI全檢機開機正常運作(1積分/單)，品質&效率須符合', 93, true),
    ('每日首件檢驗', 3, 'professional', 'technical_skills', '1,2,3,4', 'number', '單', 0.5, '每日品質首件檢驗(DIPQC)確認上機量產每單3積分(3日以上)，少量&樣品(與IPQC不重複)每單0.5積分，首件生產測量2-3顆', 94, true),
    ('首樣檢驗', 1, 'professional', 'technical_skills', '1,2,3,4', 'number', '單', 1.0, '改機後必做首樣檢驗(IPQC)後進行生產，每單1積分(1-3顆)(須出報告並簽章)，當天須完成', 95, true),
    ('零件2D製圖', 0.2, 'professional', 'technical_skills', '1,2,3,4', 'select', '圖', 0.2, '零件2D製圖，同產品多圖/次，客圖檔轉自圖(0.2積分)、抄轉圖(0.6積分)、逆向工程(3積分)、新設計圖(經採用6積分)，皆標注尺寸與相關事項，十個工作天修改不另計', 96, true),
    ('零件3D製圖', 0.4, 'professional', 'technical_skills', '1,2,3,4', 'select', '圖', 0.4, '零件3D製圖(含2D圖檔)，同產品多圖/次，客圖檔轉自圖(0.4積分)、抄轉圖(1.2積分)、逆向工程(5積分)、新設計圖(經採用8積分)，皆標注尺寸與相關事項，十個工作天修改不另計', 97, true),
    ('組合圖', 1, 'professional', 'technical_skills', '1,2,3,4', 'number', '圖', 0.5, '零件組合圖，三個零件1積分，後面增加一零件加0.5積分，須抓錯避免干涉與鬆脫', 98, true),
    ('設計簡易變更', 0.4, 'professional', 'technical_skills', '1,2,3,4', 'number', '圖', 0.1, '設計變更與簡易製圖，每張圖0.4積分(二週內再修改不計)，皆標注尺寸與相關事項，須經審核內容', 99, true),
    ('建立SOP', 1, 'professional', 'technical_skills', '1,2,3,4', 'number', '案', 1.0, '流程、做法、系統操作…等，1~2積分/案，經主管＆幹部確認可用性，並上呈管理部門保留', 100, true),
    ('品質教育', 1, 'professional', 'technical_skills', '1,2,3,4', 'number', '小時', 1.0, '經計畫表上呈，符合學習計畫，每次30分鐘，內容分視圖、檢具使用、量測手法…等品質相關，須實測考試，不限人數，受培訓者繳交學習表單，培訓者可依培訓每小時得1積分/人，但若受訓者學習表單共同評分低於標準，則積分減半', 101, true),
    ('電腦製圖教育', 1.5, 'professional', 'technical_skills', '1,2,3,4', 'number', '小時', 1.0, '經計畫表上呈，符合學習計畫，每次60分鐘，內容分2D、3D、組合圖…等製圖相關，須實測考試，限4人/次，受培訓者繳交學習表單，培訓者可依培訓每小時得1.5積分/人，但若受訓者學習表單共同評分低於標準，則積分減半', 102, true),
    ('8D報告', 3, 'professional', 'technical_skills', '1,2,3,4', 'number', '件', 1.0, '因應廠內或是客戶反應之問題製作8D分析報告，3積分/件，被退件重做不列入積分', 103, true),
    ('交期回覆', 0.2, 'professional', 'technical_skills', '1,2,3,4', 'number', '單', 0.1, '每訂單交期即時回覆，須於收到訂單2日內回覆得0.2積分，每延後一日回覆扣0.1積分', 104, true),
    ('進度追蹤', 0.4, 'professional', 'technical_skills', '1,2,3,4', 'number', '案', 0.1, '每處理事項進度追蹤得0.4積分/案，須符合預期效益，填寫表單紀錄內容', 105, true),
    ('供應商管理', 0.4, 'professional', 'technical_skills', '1,2,3,4', 'number', '案', 0.1, '處理廠商狀況管理得0.4積分/案，須符合預期效益，填寫表單紀錄內容', 106, true),
    ('專業訓練', 3, 'professional', 'technical_skills', '1,2,3,4', 'number', '2小時', 1.0, '搓牙技術(60小時)、加工機技術(20小時)、野村機台技術士(初階60小時、中階36小時)、洽群機台技術士(60小時、中階36小時)、凸輪機台技術士(訓練60小時、中階36小時)，每天最多訓練2小時，每成功培訓2小時 (繳交教育訓練紀錄表TB-08)，並於下次培訓時驗收，被培訓者驗收成績80分以上(培訓者得3積分)方進入下階段，未達80分培訓者須重新再培訓此節，並於下次驗收，再未達到80分以上，取消培訓，該人員降／轉職或解職！須有培訓紀錄並上傳！未確實訓練與驗收倒扣積分！', 107, true),
    ('開立工單', 0.1, 'professional', 'technical_skills', '1,2,3,4', 'number', '張', 0.1, '計算材料支數0.1積分/張=>確認材料庫存&訂料0.1積分/張=>開生產工單0.1積分/張=>訂單登錄在"憑單管理"0.1積分/張=>首次生產封再袋內保管0.1積分/張=>生產後資料歸檔0.1積分/張；未確實做每項扣0.2積分/張', 108, true),
    ('材料庫存盤點', 8, 'professional', 'technical_skills', '1,2,3,4', 'checkbox', '次', 1.0, '每一年底材料庫存盤點，8積分／次(依盤點人數與貢獻分配)，提出盤點表簽名確認', 109, true),
    ('外部訓練', 1, 'professional', 'technical_skills', '1,2,3,4', 'number', '小時', 1.0, '機台設備之原廠教育訓練，每天最多訓練2小時，須繳交操作SOP，並於下次使用時驗收(主管)，驗收SOP正確(受訓者得1積分／小時)，繳交教育訓練紀錄表（TB-08）；受訓者可成為內訓講師每一設備成功培訓一人可得4積分(2小時)，須先經主管驗收，並完成教育訓練紀錄表上傳！未確實訓練與驗收倒扣積分！(每機台設備、內容，每人限領一次)', 110, true),
    ('稽核SOP', 2, 'professional', 'technical_skills', '1,2,3,4', 'number', '件', 1.0, '2積分/件', 111, true);
    
    RAISE NOTICE '已插入專業積分項目 - 專業技能項目 31項';
    
    -- ==========================================
    -- 專業積分項目 - 專業職能項目 (48項)
    -- ==========================================
    
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "SubCategory", "DepartmentFilter", "InputType", "Unit", "StepValue", "Description", "SortOrder", "IsActive")
    VALUES 
    ('有效開發EDM', 0.5, 'professional', 'professional_competency', '3,4', 'number', '次', 0.1, '有效開發EDM(有回覆)(每次0.5積分)，須經審核內容', 112, true),
    ('三大財務報表', 4, 'professional', 'professional_competency', '3,4', 'select', '月', 1.0, '提供損益表(含銷貨總表與支出總表)、現金流量表：潤鼓4積分/月、精稧2積分/月(隔月10號前)(超過積分減半)；資產負債表兩個月/次，潤鼓2積分、精稧1積分', 113, true),
    ('政府補助送件', 0.5, 'professional', 'professional_competency', '3,4', 'number', '件', 0.1, '政府補助內部作業成功送件(每件0.5積分)', 114, true),
    ('三柱系統訂單', 0.2, 'professional', 'professional_competency', '3,4', 'number', '單', 0.1, '處理三柱系統訂單(每單0.2積分)，轉換成廠內工單與入正航系統，四小時內完成', 115, true),
    ('完成三柱出貨', 0.5, 'professional', 'professional_competency', '3,4', 'number', '週', 0.1, '完成三柱出貨與更新正航資訊，每週0.5積分（無出貨則沒有），須確認標籤與訂單是否有誤', 116, true),
    ('外銷出貨', 0.5, 'professional', 'professional_competency', '3,4', 'number', '次', 0.1, '外銷出貨，每次0.5積分，須確認標籤與訂單是否有誤', 117, true),
    ('訂單營收達標', 2, 'professional', 'professional_competency', '3,4', 'select', '月', 0.5, '業助每月客訂單營收達標，分配營收目標每100萬得2積分，達標九成以上得1積分，達標八成以上得0.5積分；每超標50萬額外加1積分', 118, true),
    ('應收應付對帳', 0.4, 'professional', 'professional_competency', '3,4', 'number', '家', 0.1, '完成每家應收應付帳款0.4積分，稽核到不確實扣0.4積分/家，每月5號或客戶要求日前提供，應收含開立開票與傳票', 119, true),
    ('處理訂單訂金', 0.2, 'professional', 'professional_competency', '3,4', 'number', '單', 0.1, '處理訂單0.2積分/單，確認細節、價格與付款條件，和交易客戶先收取3成訂金(訂單金額超過6萬元得0.5積分)', 120, true),
    ('行銷文', 0.5, 'professional', 'professional_competency', '3,4', 'number', '則', 0.1, '每上傳平台行銷文0.5積分/則，須經主管審核，每平台每天最多一則', 121, true),
    ('應收準時入帳', 4, 'professional', 'professional_competency', '3,4', 'checkbox', '月', 1.0, '應收帳款準時入帳，全準時=4積分/月，超過10天未入帳扣1積分/家', 122, true),
    ('客戶詢價整理', 0.2, 'professional', 'professional_competency', '3,4', 'number', '張', 0.1, '詢價整理，每張為0.2積分，須提供客戶資訊、廠商報價、委外處理條件，確認無問題，經報價成立，並回覆客戶方給分，另將廠商詢價資訊整理至雲端；客戶詢價開始48小時內完成，超過無積分，未做扣0.2積分/份', 123, true),
    ('電話聯繫客戶', 0.2, 'professional', 'professional_competency', '3,4', 'number', '家', 0.1, '10分鐘/天＝0.2積分/家(通聯紀錄)，確認詢價、客訴、需求問題，保持與客戶的良好關係，每锰3060分/月(當月交易之客戶可60分/月)，客戶抱怨扣0.4積分/家', 124, true),
    ('會議紀錄', 0.1, 'professional', 'professional_competency', '3,4', 'number', '分鐘', 0.1, '每滿30分會議0.1積分、60分會議0.2積分以此類推，未滿30分0.1積分，須於5日內繳交主管審核後，上傳雲端；不做或過期未提供扣0.1積分/日', 125, true),
    ('開立支票匯款', 0.2, 'professional', 'professional_competency', '3,4', 'number', '家', 0.1, '每家0.2積分，將應付傳票與開立支票給出納用印，導致支票&匯款開錯扣0.4積分/家', 126, true),
    ('每週業務報告', 1, 'professional', 'professional_competency', '3,4', 'number', '週', 1.0, '提供業務報告1積分/週，並於每週第一天繳交完成內容Mail給金總與紀錄業績進度表，主要報告客戶重點資訊與公司支援需求，未繳交無積分，晚一天繳交扣0.5積分；參與實際會議報告得1積分/次', 127, true),
    ('開發客戶', 0.2, 'professional', 'professional_competency', '3,4', 'number', '家', 0.2, '行銷人員開發國內客戶，新詢價0.2積分/家/次，開發客戶成交收費樣品0.5積分、下單每3萬千3積分', 128, true),
    ('客端送貨送樣', 0.5, 'professional', 'professional_competency', '3,4', 'number', '次', 0.1, '一次來回距離，每10公里0.5積分，依google地圖合法駕馭', 129, true),
    ('業績積分', 1, 'professional', 'professional_competency', '3,4', 'number', '每6600元', 1.0, '業務個人業積每營業額增加6600元，得1積分；取消訂單則取消該積分！', 130, true),
    ('品質政策', 2, 'professional', 'professional_competency', '3,4', 'number', '月', 1.0, '交貨統計表/月(含明細)，隔月10號前提供可得2積分，每超過一日提供扣0.5積分!', 131, true),
    ('招聘面試', 1, 'professional', 'professional_competency', '3,4', 'number', '人', 1.0, '負責公司招聘面試(試做)1積分，面試後成功入職加3積分，並考核過轉為正職人員加3積分，須有面談紀錄；找尋人才0.3積分/人', 132, true),
    ('員工面談', 0.5, 'professional', 'professional_competency', '3,4', 'number', '人', 0.5, '負責問題員工面談0.5積分，面談後兩週內改善加1.5積分或一個月內改善加0.5積分，須有面談紀錄', 133, true),
    ('討論&協調', 1, 'professional', 'professional_competency', '3,4', 'number', '單', 0.4, '每單討論(兩人以上)交期進度討論&協調，發起者1積分/單、與會者0.4積分/單，每單限領一次', 134, true),
    ('資訊設定', 1, 'professional', 'professional_competency', '3,4', 'number', '台', 1.0, '設定內部資訊系統、網路相關、電腦設定…等作業，每項台台，未設定好重新設定不再計分！', 135, true),
    ('敦親睦鄰', 1.5, 'professional', 'professional_competency', '3,4', 'number', '棟', 1.0, '拜訪園區左右鄰居，表達我司善意，並與之溝通協調，得1.5積分/棟', 136, true),
    ('廠商詢價', 0.1, 'professional', 'professional_competency', '3,4', 'number', '項目', 0.1, '針對客戶詢單找相對應廠商做詢價動作，每項目0.1積分，須提供廠商資訊、報價情形，確認無問題，經客戶詢單完成，並將廠商詢價資訊整理至雲端；客戶詢價開始48小時內完成，超過無積分，未做扣0.2積分/份', 137, true),
    ('庫存更新', 2, 'professional', 'professional_competency', '3,4', 'checkbox', '月', 1.0, '庫存即時更新至系統2積分/月，須經確認後更新；也要不定期(每月)抽查0.5積分/月(基本3件，不能重覆)庫存品項和數量是否正確', 138, true),
    ('Line官方', 3, 'professional', 'professional_competency', '3,4', 'number', '月', 1.0, '主要對應窗口3積分/月，在上面談成新訂單0.5積分/單(限2萬以上/單)，未回應客戶被反應或是造成公司損失扣0.5積分/家；對應客戶與廠商的問題回覆，聯繫客戶與新訊息發放…等', 139, true),
    ('報價追蹤', 0.5, 'professional', 'professional_competency', '3,4', 'number', '單', 0.1, '持續追蹤客戶之詢價單，因追蹤後而下訂單得0.5積分/單(限2萬以上/單)，如客戶遲遲未下單，也要回覆原因；首次回覆報價3日內必須再追蹤進度，發現未追蹤狀況扣0.2積分/單；後續頻率為3-5工作天定期追蹤至結果', 140, true),
    ('客戶溝通', 0.5, 'professional', 'professional_competency', '3,4', 'number', '案件', 0.1, '代公司與客戶溝通解決各種問題狀況得0.5積分/案件，須提交報告上傳狀況回覆', 141, true),
    ('電腦備份', 0.3, 'professional', 'professional_competency', '3,4', 'number', '次', 0.1, '每月定期備份電腦資料0.3積分/次，避免資料遺失', 142, true),
    ('客戶公告', 1.5, 'professional', 'professional_competency', '3,4', 'number', '次', 0.2, '發佈年度活動或公司政策變更通知有效客戶得1.5積分，包含建立公告文案；發現未通知扣0.2積分/家', 143, true),
    ('實體告示', 1, 'professional', 'professional_competency', '3,4', 'number', '次', 0.4, '發佈公司活動或公司政策於公告欄並通知全體員工得1積分，包含建立公告文案，未即時發佈扣0.2積分；若是為5S相關告示得0.4積分/份(同一文宣)，如：飲水機操作步驟、冰箱放置守則…等，須拍照上傳', 144, true),
    ('接洽訪客', 0.4, 'professional', 'professional_competency', '3,4', 'number', '家', 0.1, '代公司處理訪客問題0.4積分/家，如客戶來取貨、廠商送貨、廠商或客戶臨時來訪！', 145, true),
    ('年節通告', 1, 'professional', 'professional_competency', '3,4', 'number', '次', 0.5, '發佈公司年節祝賀通知得1積分，與客戶建立良好連結關係，祝賀設計0.5積分/次', 146, true),
    ('ISO品質精神', 6, 'professional', 'professional_competency', '3,4', 'select', '項', 1.0, '依照ISO精神需求，持續維護相關品質文件，如：量具校正6積分/年、機台維修保養紀鈄1.5積分/台、供應商評銑4積分/年、產品生產流程表5積分/產品…等資訊', 147, true),
    ('客戶調查', 0.3, 'professional', 'professional_competency', '3,4', 'number', '家', 0.1, '每半年有效客戶滿意度調查一次0.3積分/家，每次提出不同問題詢問，瞭解客戶真正需求，包含做調查問卷；主要對應人員之得分：計算方式調查結果總問卷得分/有效客戶數；非常滿意10積分、滿意5積分、普通3積分、不滿意扣3積分、非常不滿意扣10積分', 148, true),
    ('甲存統計', 1, 'professional', 'professional_competency', '3,4', 'checkbox', '月', 1.0, '每月甲存確實統計得1積分，需於存入兩日前提供資訊；若不確實扣2積分', 149, true),
    ('出貨稽核', 0.5, 'professional', 'professional_competency', '3,4', 'number', '單', 0.1, '確認出口貨物是否正確0.5積分/單，包含內外標籤、實體產品、單據填寫、貨運地點&公司…等，未稽核導致出錯扣0.5積分/單，請於出貨前做好稽核動作與簽名，並拍照上傳', 150, true),
    ('材料價格整理', 2, 'professional', 'professional_competency', '3,4', 'number', '次', 1.0, '基本每四個月(1~4、5~8、9~12)提供主要材料漲跌幅報告，並發送給這期間下單滿50萬以上的常效客戶材料異動資訊得2積分/次，讓客戶感受我們的經營服務', 151, true),
    ('回收處理', 2, 'professional', 'professional_competency', '3,4', 'number', '次', 1.0, '確實處理廢料回收與紀錄得2積分/次，僅能幹部或儲備幹部一人當任對應窗口(須簽名)，避免廠商回收不老實，並要求廠商清潔', 152, true),
    ('車庫取料', 0.5, 'professional', 'professional_competency', '3,4', 'number', '次', 0.1, '於停車場車庫取料得0.5積分/次，須提供取料資訊，留意週圍是否有易燃物，並且關好門', 153, true),
    ('客戶取件', 1, 'professional', 'professional_competency', '3,4', 'select', '次', 0.5, '至客戶端那邊取件，包含異常品、樣品、配合件、量具、圖面、被加工品…等，基本機車1積分、開車1.5積分，須提供內容', 154, true),
    ('採購處理', 0.5, 'professional', 'professional_competency', '3,4', 'number', '次', 0.5, '針對需求對外詢價採購(比價)，首次詢價得0.5積分，再次詢價比前面價格便宜(每差價達三仟元得1積分)；針對原廠商常購品議價每10%得1積分，談到免費得3積分(依狀況提出)；須有比價紀錄', 155, true),
    ('貨運狀況查詢', 0.3, 'professional', 'professional_competency', '3,4', 'number', '次', 0.1, '查詢應到而未到之貨物，要求廠商立即處理，並盡速提報給客戶得0.3積分', 156, true),
    ('異常退貨處理', 5, 'professional', 'professional_competency', '3,4', 'select', '筆', 1.0, '應對客戶處理異常狀況，包含提供報告，若談到不用退貨不用賠償得5積分/筆、談到特採得3積分/筆、談到事後補貨處理得1積分', 157, true),
    ('客戶需求處理', 0.1, 'professional', 'professional_competency', '3,4', 'select', '項', 0.1, '處理客戶需求之報告0.1/份、測試0.2/項、專業知識0.3/問題、現有樣品替代0.4/單…等，並完成需求單滿意度調查', 158, true),
    ('營收目標達成', 5, 'professional', 'professional_competency', '3,4', 'checkbox', '月', 1.0, '5積分/月', 159, true);
    
    RAISE NOTICE '已插入專業積分項目 - 專業職能項目 48項';
    
    -- ==========================================
    -- 管理積分項目 (20項)
    -- ==========================================
    
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "SubCategory", "DepartmentFilter", "InputType", "Unit", "StepValue", "Description", "SortOrder", "IsActive")
    VALUES 
    ('下屬工作日誌', 0.5, 'management', '', '3,4', 'number', '人/週', 0.1, '下屬每週繳交每日工作日誌(每週0.5積分/人)', 160, true),
    ('下屬積分達標', 3, 'management', '', '3,4', 'select', '人', 0.5, '下屬每月工作積分超過82%↑3積分/人、超過72%↑1.5積分/人，未達標68%扣1積分／人', 161, true),
    ('稽核SOP', 2, 'management', '', '3,4', 'number', '件', 1.0, '十天內，確認SOP可用性(2積分/件)，確認完成須上傳至雲端；未確認扣2積分／件', 162, true),
    ('稽核抽檢', 0.5, 'management', '', '3,4', 'number', '款/日', 0.1, '二次(32PCS抽檢不良率超標)再抽檢確認(每款0.5積分/日)(200PCS抽驗)，須有記錄上傳雲端', 163, true),
    ('有效改善對策', 1, 'management', '', '3,4', 'number', '件', 1.0, '發現異常並提出有效改善報告(每件1積分)，須向上報告經核可(小成本改善可先做後補)', 164, true),
    ('人力管控', 0.2, 'management', '', '3,4', 'number', '人/日', 0.1, '人人時時有積分，瞭解並安排下屬隔日工作(提供下屬每日工作表)(每日0.2積分/人)(每月抓四週)', 165, true),
    ('損耗率控管', 6, 'management', '', '3,4', 'select', '月', 0.5, '生產損耗率2%以下(6積分/月)(每多0.5%少1積分)', 166, true),
    ('部門預算控管', 4, 'management', '', '3,4', 'select', '月', 1.0, '生產部門當月預算低於50%=4積分，低於30%=3積分，低於10%=2積分(部門預算由一人控管)(預算金額由管理部分配)(預計基本為每單2000元)，高出預算沒合理解釋，每單超過500元扣0.5積分；每月結餘預算可累計至年底結算，結算之餘額50%由該部門自行分配運用或累計至下年度！', 167, true),
    ('達交率控管', 6, 'management', '', '3,4', 'checkbox', '月', 1.0, '交貨達成率(6積分/月)(96%以上，每少2%扣0.5積分，依責任歸屬)(實際出貨數/預計出貨數)，團體積分', 168, true),
    ('教育訓練', 3, 'management', '', '3,4', 'number', '2小時', 1.0, '教育訓練，要先有計畫表上呈，符合學習計畫，受培訓者繳交學習報告，經考核後，培訓者可依培訓每兩小時得3積分，但受培訓者考核不通過，則積分減半', 169, true),
    ('管理生產履歷', 0.1, 'management', '', '3,4', 'number', '份', 0.1, '負責生產履歷微調(每份0.1積分)，須經審核內容，每次更新0.1積分/款(每單)', 170, true),
    ('生產達成率', 4.5, 'management', '', '3,4', 'checkbox', '月', 1.0, '月生產達成率達標4.5積分/月(每超出一天扣0.5積分)，依工單應達交時程(準時)', 171, true),
    ('審核記錄', 0.2, 'management', '', '3,4', 'number', '張', 0.1, '供應商管理、異常管理，每張(家)0.2積分，須於2日內審核完，並確認是否上傳雲端，內容須確保無誤', 172, true),
    ('幹部會議', 1, 'management', '', '3,4', 'checkbox', '次', 1.0, '參與幹部會議1積分，並於前一天繳交開會內容，當天報告細節與詢問支援，未繳交無積分', 173, true),
    ('發起討論', 2, 'management', '', '3,4', 'number', '案', 0.8, '幹部可發起討論2積分/案 (三人以上，一小時以上會議)，找直接人員討論並得出可靠結果，兩天內產出報告且參與人簽名，經主管審核通過後上傳至雲端，參與者0.8積分；審核內容無結論或解決方案則無積分', 174, true),
    ('交接工作', 4, 'management', '', '3,4', 'number', '日', 1.5, '幹部負責處理同仁交接事項，每個職務交接4積分/日，最夒5日，交接後3日內完成SOP報告上傳雲端；也可安排其他同仁執行交接，幹部負責稽核驗收交接狀況1.5積分/日，同樣上傳雲端', 175, true),
    ('調換職務', 10, 'management', '', '3,4', 'number', '次', 1.0, '接受輪調職務10天/次，每三個月會有指派輪調的機會，體會其他職務的甘苦過程、順便換換心情，10積分/次(須繳交心得報告，提出改善對策)', 176, true),
    ('驗收與更新', 2, 'management', '', '3,4', 'number', '人', 1.0, '負責驗收教育訓練學習狀況，每確實驗收／人得２積分，並完成（TB-07）員工教育訓練資歷表更新上傳', 177, true),
    ('代替處理', 2, 'management', '', '3,4', 'number', '項目', 1.0, '代替公司處理對外事務可得2積分/項目，須提出可顯示之憑單或證明', 178, true),
    ('追蹤進度', 0.5, 'management', '', '3,4', 'number', '次', 0.1, '追蹤下屬進度0.5積分/次，並追蹤當日確認下屬工作日誌是否有填寫', 179, true);
    
    RAISE NOTICE '已插入管理積分項目 20項';
    
    -- ==========================================
    -- 臨時工作積分項目 (3項)
    -- ==========================================
    
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "SubCategory", "DepartmentFilter", "InputType", "Unit", "StepValue", "Description", "SortOrder", "IsActive")
    VALUES 
    ('藍牙喇叭', 1, 'temporary', '', '1,2,3,4', 'number', '台', 1.0, '提供已不用但可用的藍牙喇叭讓現場使用(拍照並依實際為主)，得1積分/台，9月', 180, true),
    ('投影機', 1, 'temporary', '', '1,2,3,4', 'number', '台', 1.0, '尋找合用投影機，得1積分，預算2萬左右，超出要申報核可，10月25前完成', 181, true),
    ('倉庫整理', 8, 'temporary', '', '1,2,3,4', 'number', '次', 1.0, '完成倉庫規畫整理定位得8積分，9月25前完成 延至10月25日前完成', 182, true);
    
    RAISE NOTICE '已插入臨時工作積分項目 3項';
    
    -- ==========================================
    -- 雜項事件 (2項)
    -- ==========================================
    
    INSERT INTO "StandardSettings" ("CategoryName", "PointsValue", "PointsType", "SubCategory", "DepartmentFilter", "InputType", "Unit", "StepValue", "Description", "SortOrder", "IsActive")
    VALUES 
    ('信件分類整理', 0.2, 'misc', '', '1,2,3,4', 'number', '次', 0.1, '指定人員，每天個人信件即時分類，主管個人信件直接移交，未做好即時移交扣0.2積分/次；造成其它信件過期扣0.2積分', 183, true),
    ('聯繫廠商', 0.1, 'misc', '', '1,2,3,4', 'number', '次', 0.1, '聯繫廠商業務項目交代或洽詢', 184, true);
    
    RAISE NOTICE '已插入雜項事件 2項';
    
    -- 最終統計計算
    SELECT 
        COUNT(*) as "總積分項目數",
        COUNT(CASE WHEN "PointsType" = 'general' THEN 1 END) as "一般積分",
        COUNT(CASE WHEN "PointsType" = 'professional' THEN 1 END) as "專業積分",
        COUNT(CASE WHEN "PointsType" = 'management' THEN 1 END) as "管理積分",
        COUNT(CASE WHEN "PointsType" = 'temporary' THEN 1 END) as "臨時項目",
        COUNT(CASE WHEN "PointsType" = 'misc' THEN 1 END) as "雜項事件"
    FROM "StandardSettings";
    
    RAISE NOTICE '=== 積分管理系統資料庫 V2.0 初始化完成 (184項) ===';
    
END $$;

-- 顯示創建結果
SELECT 'Database V2.0 initialization starting (184 items total)' as status;
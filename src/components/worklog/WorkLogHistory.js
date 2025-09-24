import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, DatePicker, Table, Button, Modal, message } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const WorkLogHistory = () => {
  // 狀態管理
  const [loading, setLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 搜索參數
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    dateRange: [],
  });

  // 差異比較狀態
  const [diffVisible, setDiffVisible] = useState(false);
  const [currentDiff, setCurrentDiff] = useState(null);

  // 表格列定義
  const columns = [
    {
      title: '員工姓名',
      dataIndex: 'employeeName',
      width: 120,
    },
    {
      title: '日誌標題',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '修改時間',
      dataIndex: 'modifiedAt',
      width: 150,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '修改人',
      dataIndex: 'modifiedBy',
      width: 120,
    },
    {
      title: '修改內容',
      key: 'changes',
      width: 100,
      render: (_, record) => (
        <Button type="link" onClick={() => showDiff(record)}>
          查看變更
        </Button>
      ),
    },
    {
      title: '審核狀態',
      dataIndex: 'approvalStatus',
      width: 100,
      render: (status) => getStatusText(status),
    },
  ];

  // 獲取歷史數據
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchParams.keyword,
        startDate: searchParams.dateRange[0]?.format('YYYY-MM-DD'),
        endDate: searchParams.dateRange[1]?.format('YYYY-MM-DD'),
      };

      const response = await fetch('/api/worklogs/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      setHistoryList(data.items);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      message.error('獲取歷史記錄失敗');
      console.error('獲取工作日誌歷史失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 顯示差異比較
  const showDiff = async (record) => {
    try {
      const response = await fetch(`/api/worklogs/${record.id}/diff`);
      const diffData = await response.json();
      setCurrentDiff(diffData);
      setDiffVisible(true);
    } catch (error) {
      message.error('獲取變更內容失敗');
      console.error('獲取差異比較失敗:', error);
    }
  };

  // 工具函數
  const getStatusText = (status) => {
    const statusTexts = {
      pending: '待審核',
      approved: '已通過',
      rejected: '已拒絕',
    };
    return statusTexts[status] || status;
  };

  // 初始化加載數據
  useEffect(() => {
    fetchHistory();
  }, [pagination.current, pagination.pageSize]);

  return (
    <div className="worklog-history-container" style={{ padding: '0' }}>
      <div className="worklog-content" style={{
        background: 'transparent',
        minHeight: '100vh',
        width: '100%',
      }}>
        <Card 
          title={<span style={{ color: '#e2e8f0' }}>工作日誌編輯歷史</span>}
          bordered={false}
          className="worklog-card"
          style={{
            background: 'rgba(15, 23, 42, 0.3)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(148, 163, 184, 0.1)',
            borderRadius: '8px',
          }}
          headStyle={{
            background: 'rgba(15, 23, 42, 0.5)',
            borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
          }}
          bodyStyle={{
            background: 'transparent',
          }}>
        {/* 搜索和篩選區 */}
        <div className="filter-section" style={{ marginBottom: '16px' }}>
          <Row gutter={12}>
            <Col span={6}>
              <Input.Search
                placeholder="搜索員工姓名/標題"
                value={searchParams.keyword}
                onChange={e => setSearchParams(prev => ({ ...prev, keyword: e.target.value }))}
                onSearch={fetchHistory}
              />
            </Col>
            <Col span={6}>
              <RangePicker
                value={searchParams.dateRange}
                onChange={dates => {
                  setSearchParams(prev => ({ ...prev, dateRange: dates }));
                  fetchHistory();
                }}
                placement="topLeft"
                popupStyle={{
                  background: 'rgba(15, 23, 42, 0.95)',
                }}
                format="YYYY-MM-DD"
                picker="date"
                mode={['date', 'date']}
                showNextBtn={true}
                showPrevBtn={true}
                showSuperNextBtn={true}
                showSuperPrevBtn={true}
                placeholder={['開始日期', '結束日期']}
                style={{ color: '#e2e8f0' }}
              />
            </Col>
          </Row>
        </div>

        {/* 數據表格 */}
        <Table
          columns={columns}
          dataSource={historyList}
          loading={loading}
          pagination={pagination}
          onChange={(pag) => setPagination(pag)}
          rowKey="id"
        />

        {/* 變更比較彈窗 */}
        <Modal
          open={diffVisible}
          title="內容變更比較"
          width={800}
          footer={null}
          onCancel={() => setDiffVisible(false)}
        >
          {currentDiff && (
            <div className="diff-content">
              <div className="diff-item">
                <h4>修改前：</h4>
                <pre>{currentDiff.oldContent}</pre>
              </div>
              <div className="diff-item">
                <h4>修改後：</h4>
                <pre>{currentDiff.newContent}</pre>
              </div>
            </div>
          )}
        </Modal>
        </Card>
      </div>
    </div>
  );
};

export default WorkLogHistory;

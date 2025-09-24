import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, DatePicker, Table, Tag, Button, Modal, Form, message } from 'antd';
import dayjs from 'dayjs';
import '../../styles/worklog.css';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const WorkLogApproval = () => {
  // 自定義主題樣式
  const customTheme = {
    components: {
      Table: {
        headerBg: 'rgba(30, 41, 59, 0.8)',
        headerColor: '#e2e8f0',
        rowHoverBg: 'rgba(51, 65, 85, 0.5)',
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
      Select: {
        background: 'rgba(30, 41, 59, 0.8)',
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
      Input: {
        background: 'rgba(30, 41, 59, 0.8)',
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
    },
  };
  // 狀態管理
  const [loading, setLoading] = useState(false);
  const [worklogList, setWorklogList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  // 搜索參數
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    status: '',
    dateRange: [],
  });

  // 模態框狀態
  const [detailVisible, setDetailVisible] = useState(false);
  const [approvalVisible, setApprovalVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [approvalType, setApprovalType] = useState('approve');
  const [approvalForm] = Form.useForm();

  // 表格列定義
  const columns = [
    {
      title: '員工姓名',
      dataIndex: 'employeeName',
      width: 100,
      align: 'center',
    },
    {
      title: '提交日期',
      dataIndex: 'logDate',
      width: 130,
      align: 'center',
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
    },
    {
      title: '標題',
      dataIndex: 'title',
      ellipsis: true,
      align: 'center',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 80,
      align: 'center',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    // 修改操作列渲染
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <div>
          <Button type="link" onClick={() => handleView(record)}>查看</Button>
          {(record.status === 'pending' || record.status === 'edit_pending') && (
            <>
              <Button type="primary" onClick={() => handleApprove(record)}>通過</Button>
              <Button danger onClick={() => handleReject(record)}>拒絕</Button>
            </>
          )}
        </div>
      ),
    },
  ];


  // 修改獲取數據的API調用
  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.current,
        pageSize: pagination.pageSize,
        keyword: searchParams.keyword,
        status: searchParams.status,
        startDate: searchParams.dateRange[0]?.format('YYYY-MM-DD'),
        endDate: searchParams.dateRange[1]?.format('YYYY-MM-DD'),
      };

      const queryString = new URLSearchParams({
        ...params,
        startDate: params.startDate || '',
        endDate: params.endDate || '',
      }).toString();
      
      // 修改API端點以包含編輯審核
      const response = await fetch(`/api/worklog/approval-list?${queryString}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      setWorklogList(data.items);
      setPagination(prev => ({ ...prev, total: data.total }));
    } catch (error) {
      message.error('獲取數據失敗');
      console.error('獲取工作日誌列表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 處理查看詳情
  const handleView = (record) => {
    setCurrentRecord(record);
    setDetailVisible(true);
  };

  // 處理審核操作
  const handleApprove = (record) => {
    setApprovalType('approve');
    setCurrentRecord(record);
    setApprovalVisible(true);
  };

  const handleReject = (record) => {
    setApprovalType('reject');
    setCurrentRecord(record);
    setApprovalVisible(true);
  };

  // 提交審核
  const handleApprovalSubmit = async () => {
    try {
      const values = await approvalForm.validateFields();
      
      const response = await fetch(`/api/worklog/${currentRecord.id}/approval`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: approvalType === 'approve' ? 'approved' : 'rejected',
          comments: values.comments,
        }),
      });

      if (response.ok) {
        message.success('審核成功');
        setApprovalVisible(false);
        approvalForm.resetFields();
        fetchData();

        // 如果是通過審核且是首次提交，自動添加積分
        if (approvalType === 'approve' && !currentRecord.hasPoints) {
          await addWorkLogPoints(currentRecord.employeeId);
        }
      } else {
        message.error('審核失敗');
      }
    } catch (error) {
      message.error('審核失敗');
      console.error('審核失敗:', error);
    }
  };

  // 添加工作日誌積分
  const addWorkLogPoints = async (employeeId) => {
    try {
      await fetch('/api/points/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employeeId,
          points: 1,
          type: 'worklog_first_submit',
        }),
      });
    } catch (error) {
      console.error('添加積分失敗:', error);
    }
  };

  // 工具函數
  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'warning',
      edit_pending: 'processing',
      approved: 'success',
      auto_approved: 'cyan',
      rejected: 'error',
    };
    return statusColors[status] || 'default';
  };

  // 修改狀態顯示函數
  const getStatusText = (status) => {
    const statusTexts = {
      pending: '待審核',
      edit_pending: '編輯待審核',
      approved: '已通過',
      auto_approved: '自動通過',
      rejected: '已拒絕',
    };
    return statusTexts[status] || status;
  };

  // 初始化加載數據
  useEffect(() => {
    fetchData();
  }, [pagination.current, pagination.pageSize]);

  return (
    <div className="worklog-approval-container" style={{ padding: '0' }}>
      <div className="worklog-content" style={{
        background: 'transparent',
        minHeight: '100vh',
        width: '100%',
      }}>
        <Card 
          title={<span style={{ color: '#e2e8f0' }}>工作日誌審核管理</span>}
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
          }}
        >
        {/* 搜索和篩選區 */}
        <div className="filter-section" style={{ marginBottom: '16px' }}>
          <Row gutter={12}>
            <Col span={6}>
              <Input.Search
                placeholder="搜索員工姓名/標題"
                value={searchParams.keyword}
                onChange={e => setSearchParams(prev => ({ ...prev, keyword: e.target.value }))}
                onSearch={fetchData}
              />
            </Col>
            <Col span={6}>
              <Select
                placeholder="審核狀態"
                style={{ width: '100%' }}
                value={searchParams.status}
                onChange={value => {
                  setSearchParams(prev => ({ ...prev, status: value }));
                  fetchData();
                }}
              >
                <Select.Option value="">全部</Select.Option>
                <Select.Option value="pending">待審核</Select.Option>
                <Select.Option value="edit_pending">編輯待審核</Select.Option>
                <Select.Option value="approved">已通過</Select.Option>
                <Select.Option value="auto_approved">自動通過</Select.Option>
                <Select.Option value="rejected">已拒絕</Select.Option>
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                value={searchParams.dateRange}
                onChange={dates => {
                  setSearchParams(prev => ({ ...prev, dateRange: dates }));
                  fetchData();
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
          dataSource={worklogList}
          loading={loading}
          pagination={pagination}
          onChange={(pag) => setPagination(pag)}
          rowKey="id"
          className="custom-table"
          style={{
            background: 'rgba(30, 41, 59, 0.5)',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        />

        {/* 查看詳情彈窗 */}
        <Modal
          open={detailVisible}
          title="工作日誌詳情"
          width={800}
          footer={null}
          onCancel={() => setDetailVisible(false)}
        >
          {currentRecord && (
            <div className="detail-content">
              <p><strong>員工：</strong>{currentRecord.employeeName}</p>
              <p><strong>提交時間：</strong>{dayjs(currentRecord.logDate).format('YYYY-MM-DD HH:mm:ss')}</p>
              <p><strong>標題：</strong>{currentRecord.title}</p>
              <p><strong>內容：</strong>{currentRecord.content}</p>
              <p><strong>狀態：</strong>{getStatusText(currentRecord.status)}</p>
              {currentRecord.reviewComments && (
                <p><strong>審核意見：</strong>{currentRecord.reviewComments}</p>
              )}
            </div>
          )}
        </Modal>

        {/* 審核操作彈窗 */}
        <Modal
          open={approvalVisible}
          title={approvalType === 'approve' ? '通過審核' : '拒絕審核'}
          onOk={handleApprovalSubmit}
          onCancel={() => {
            setApprovalVisible(false);
            approvalForm.resetFields();
          }}
        >
          <Form form={approvalForm}>
            <Form.Item
              label="審核意見"
              name="comments"
              rules={[{ required: true, message: '請輸入審核意見' }]}
            >
              <TextArea rows={4} placeholder="請輸入審核意見" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
      </div>
    </div>
  );
};

export default WorkLogApproval;

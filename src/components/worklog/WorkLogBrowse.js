import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Input, Select, DatePicker, Table, Button, Modal, message, Space } from 'antd';
import { EyeOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import '../../styles/worklog.css';
import { getApiUrl } from '../../config/apiConfig';
import { workLogAPI } from '../../services/pointsAPI';

// 添加自定義樣式
const customStyles = `
  /* 搜索框樣式 */
  .custom-input {
    color: #e2e8f0 !important;
  }

  .custom-input::placeholder {
    color: rgba(148, 163, 184, 0.8) !important;
  }

  .custom-input .ant-input {
    background: transparent !important;
    border: none !important;
    padding: 0 11px !important;
    height: 32px !important;
    line-height: 32px !important;
    color: #e2e8f0 !important;
    text-align: center !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
  }

  .custom-input .ant-input::placeholder {
    text-align: center !important;
    line-height: 32px !important;
    height: 32px !important;
  }

  .custom-input .ant-input-clear-icon,
  .custom-input .ant-input-suffix {
    color: rgba(148, 163, 184, 0.5) !important;
    background: transparent !important;
  }

  .custom-input .ant-input-clear-icon:hover {
    color: rgba(148, 163, 184, 0.8) !important;
  }

  .custom-input:hover,
  .custom-input:focus,
  .custom-input:focus-within {
    border-color: #1890ff !important;
    box-shadow: none !important;
  }
  .ant-table-body {
    overflow-x: auto !important;
    overflow-y: auto !important;
  }
  
  .ant-table-ping-left:not(.ant-table-has-fix-left) 
  .ant-table-container::before {
    box-shadow: none !important;
  }
  
  .ant-table-ping-right:not(.ant-table-has-fix-right) 
  .ant-table-container::after {
    box-shadow: none !important;
  }

  .ant-table-cell-fix-left,
  .ant-table-cell-fix-right {
    background: transparent !important;
  }

  .ant-table-wrapper .ant-table-container::before,
  .ant-table-wrapper .ant-table-container::after {
    display: none !important;
  }

  .ant-table-wrapper .ant-table-thead .ant-table-cell {
    background: rgba(15, 23, 42, 0.98) !important;
  }

  .ant-table-wrapper .ant-table-tbody > tr.ant-table-row:hover > td {
    background: rgba(30, 41, 59, 0.5) !important;
  }

  .ant-table-ping-left .employee-name-cell {
    box-shadow: 4px 0 6px -1px rgba(0, 0, 0, 0.2) !important;
  }

  .ant-table-ping-right .action-cell {
    box-shadow: -4px 0 6px -1px rgba(0, 0, 0, 0.2) !important;
  }
`;

// 添加樣式到 head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = customStyles;
  document.head.appendChild(style);
}

const { RangePicker } = DatePicker;
const { Option } = Select;

const WorkLogBrowse = () => {
  // 狀態管理
  const [loading, setLoading] = useState(false);
  const [worklogList, setWorklogList] = useState([]);
  const [employeeList, setEmployeeList] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 搜索參數
  const [searchParams, setSearchParams] = useState({
    keyword: '',
    employeeId: null,
    dateRange: [],
    year: null,
    month: null,
    day: null,
  });

  // 模態框狀態
  const [detailVisible, setDetailVisible] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);

  // 表格列定義
  const columns = [
    {
      title: '員工姓名',
      dataIndex: 'employeeName',
      width: 120,
      align: 'center',
      fixed: 'left',
      render: (text) => (
        <div className="employee-name-cell" style={{
          background: 'rgba(30, 41, 59, 0.95)',
          height: '100%',
          width: '100%',
          position: 'absolute',
          left: 0,
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e2e8f0',
          fontWeight: 500,
          backdropFilter: 'blur(12px)',
          borderRight: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
          zIndex: 3,
          transition: 'box-shadow 0.3s ease',
        }}>
          {text}
        </div>
      ),
    },
    {
      title: '員工編號',
      dataIndex: 'employeeNumber',
      width: 100,
      align: 'center',
    },
    {
      title: '日誌日期',
      dataIndex: 'logDate',
      width: 130,
      align: 'center',
      render: (text) => dayjs(text).format('YYYY-MM-DD'),
      sorter: (a, b) => dayjs(a.logDate).unix() - dayjs(b.logDate).unix(),
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      width: 180,
      align: 'center',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '編輯狀態',
      dataIndex: 'updatedAt',
      width: 180,
      align: 'center',
      render: (text, record) => {
        // 獲取編輯次數
        const editCount = workLogAPI.getWorkLogEditCount(record.id);
        const remainingEdits = 2 - editCount;
        
        // 如果沒有更新時間，表示未編輯過
        if (!text) {
          return (
            <div style={{
              background: 'rgba(30, 41, 59, 0.5)',
              padding: '4px 8px',
              borderRadius: '4px',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              position: 'relative',
              zIndex: 1,
            }}>
              <span style={{ color: '#94a3b8' }}>未編輯</span>
              <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                可編輯次數：2次
              </div>
            </div>
          );
        }
        
        return (
          <div style={{
            background: 'rgba(30, 41, 59, 0.95)',
            padding: '4px 8px',
            borderRadius: '4px',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(148, 163, 184, 0.2)',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            zIndex: 1,
          }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '2px' }}>最後編輯於</div>
            <div style={{ color: '#e2e8f0' }}>{dayjs(text).format('YYYY-MM-DD HH:mm')}</div>
            <div style={{ 
              color: remainingEdits > 0 ? '#94a3b8' : '#ef4444',
              fontSize: '12px',
              marginTop: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}>
              {remainingEdits > 0 ? (
                <>
                  <span>剩餘編輯次數：{remainingEdits}次</span>
                </>
              ) : (
                <>
                  <span>已達編輯上限</span>
                </>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: '標題',
      dataIndex: 'title',
      ellipsis: true,
      width: 200,
    },
    {
      title: '分類',
      dataIndex: 'categoryName',
      width: 100,
      align: 'center',
    },
    {
      title: '狀態',
      dataIndex: 'status',
      width: 100,
      align: 'center',
      render: (status) => getStatusTag(status),
    },
    {
      title: '積分',
      dataIndex: 'pointsClaimed',
      width: 80,
      align: 'center',
      render: (points) => points || 0,
    },
    {
      title: '創建時間',
      dataIndex: 'createdAt',
      width: 150,
      align: 'center',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <div className="action-cell" style={{
          background: 'rgba(30, 41, 59, 0.95)',
          height: '100%',
          width: '100%',
          position: 'absolute',
          right: 0,
          top: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backdropFilter: 'blur(12px)',
          borderLeft: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 0 0 rgba(0, 0, 0, 0)',
          zIndex: 3,
          transition: 'box-shadow 0.3s ease',
        }}>
          <Button 
            type="link"
            icon={<EyeOutlined style={{ 
              color: '#60a5fa',
              filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.5))',
            }} />}
            onClick={() => handleView(record)}
            style={{ 
              color: '#60a5fa',
              textShadow: '0 0 8px rgba(96, 165, 250, 0.5)',
              transition: 'all 0.3s ease',
            }}
            className="hover:text-blue-300"
          >
            查看
          </Button>
        </div>
      ),
    },
  ];

  // 獲取員工列表
  const fetchEmployeeList = async () => {
    try {
      const response = await fetch(getApiUrl('/auth/employees'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const employees = await response.json();
        setEmployeeList(employees);
      } else {
        console.error('獲取員工列表失敗');
      }
    } catch (error) {
      console.error('獲取員工列表失敗:', error);
    }
  };

  // 獲取工作日誌數據
  const fetchData = async () => {
    setLoading(true);
    try {
      // 處理日期範圍
      let startDate = null;
      let endDate = null;
      if (searchParams.dateRange && searchParams.dateRange.length === 2) {
        if (searchParams.dateRange[0]) {
          startDate = dayjs(searchParams.dateRange[0])
            .startOf('day')
            .format('YYYY-MM-DDTHH:mm:ss[Z]');
        }
        if (searchParams.dateRange[1]) {
          endDate = dayjs(searchParams.dateRange[1])
            .endOf('day')
            .format('YYYY-MM-DDTHH:mm:ss[Z]');
        }
      }

      // 移除空值和未定義的參數
      const params = new URLSearchParams(
        Object.entries({
          page: pagination.current.toString(),
          pageSize: pagination.pageSize.toString(),
          keyword: searchParams.keyword,
          employeeId: searchParams.employeeId,
          startDate,
          endDate,
          year: searchParams.year,
          month: searchParams.month,
          day: searchParams.day,
        }).filter(([_, value]) => value !== null && value !== undefined && value !== '')
      );

      const response = await fetch(getApiUrl(`/worklog/all-employees?${params}`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWorklogList(data.items || []);
        setPagination(prev => ({ 
          ...prev, 
          total: data.total || 0 
        }));
      } else {
        console.error('獲取工作日誌列表失敗');
      }
    } catch (error) {
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

  // 重置篩選條件
  const handleReset = async () => {
    setSearchParams({
      keyword: '',
      employeeId: null,
      dateRange: [],
      year: null,
      month: null,
      day: null,
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    // 重置後立即獲取數據
    await fetchData();
  };

  // 狀態標籤渲染
  const getStatusTag = (status) => {
    const statusConfig = {
      submitted: { color: 'orange', text: '已提交' },
      pending: { color: 'orange', text: '待審核' },
      edit_pending: { color: 'blue', text: '編輯待審核' },
      approved: { color: 'green', text: '已通過' },
      auto_approved: { color: 'cyan', text: '自動通過' },
      rejected: { color: 'red', text: '已拒絕' },
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <span style={{ color: config.color }}>{config.text}</span>;
  };

  // 初始化
  useEffect(() => {
    fetchEmployeeList();
  }, []);

  useEffect(() => {
    fetchData();
  }, [
    pagination.current,
    pagination.pageSize,
    searchParams.employeeId,
    searchParams.dateRange,
    searchParams.year,
    searchParams.month,
    searchParams.day
  ]);

  return (
    <div className="worklog-browse-container" style={{ padding: '0' }}>
      <div className="worklog-content" style={{
        background: 'transparent',
        minHeight: '100vh',
        width: '100%',
      }}>
        <Card 
          title={<span style={{ color: '#e2e8f0' }}>📋 所有員工 - 工作日誌瀏覽</span>}
          variant="borderless"
          className="worklog-card"
          styles={{
            root: {
              background: 'rgba(15, 23, 42, 0.3)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '8px',
            },
            header: {
              background: 'rgba(15, 23, 42, 0.5)',
              borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
            },
            body: {
              background: 'transparent',
            }
          }}
        >
          {/* 搜索和篩選區 */}
          <div className="filter-section" style={{ marginBottom: '16px' }}>
            <Row gutter={[12, 12]}>
              <Col span={6}>
                <div className="custom-input-wrapper" style={{ width: '100%' }}>
                  <Input
                    placeholder="搜索標題/內容/員工姓名"
                    value={searchParams.keyword}
                    onChange={e => setSearchParams(prev => ({ ...prev, keyword: e.target.value }))}
                    onPressEnter={fetchData}
                    suffix={<SearchOutlined style={{ color: 'rgba(148, 163, 184, 0.5)' }} />}
                    allowClear
                    className="custom-input"
                    style={{
                      background: 'rgba(30, 41, 59, 0.8)',
                      borderColor: 'rgba(148, 163, 184, 0.2)',
                      color: '#e2e8f0',
                      height: '32px',
                      lineHeight: '32px',
                      borderRadius: '6px',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0 11px',
                    }}
                  />
                </div>
              </Col>
              <Col span={6}>
                <Select
                  placeholder="選擇員工"
                  style={{ width: '100%' }}
                  value={searchParams.employeeId}
                  onChange={value => setSearchParams(prev => ({ ...prev, employeeId: value }))}
                  allowClear
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {employeeList.map(emp => (
                    <Option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employeeNumber})
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <RangePicker
                  value={searchParams.dateRange}
                  onChange={dates => setSearchParams(prev => ({ ...prev, dateRange: dates || [] }))}
                  placeholder={['開始日期', '結束日期']}
                  style={{
                    width: '100%',
                  }}
                  styles={{
                    root: {
                      background: 'rgba(30, 41, 59, 0.8)',
                      borderColor: 'rgba(148, 163, 184, 0.2)',
                    },
                    popup: {
                      root: {
                        background: 'rgba(15, 23, 42, 0.95)',
                      }
                    }
                  }}
                />
              </Col>
            </Row>

            {/* 年月日精確篩選器 */}
            <Row gutter={[12, 12]} style={{ marginTop: '12px' }}>
              <Col span={4}>
                <Select
                  placeholder="年份"
                  style={{ width: '100%' }}
                  value={searchParams.year}
                  onChange={value => setSearchParams(prev => ({ ...prev, year: value }))}
                  allowClear
                >
                  {Array.from({ length: 10 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <Option key={year} value={year}>
                        {year}年
                      </Option>
                    );
                  })}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="月份"
                  style={{ width: '100%' }}
                  value={searchParams.month}
                  onChange={value => setSearchParams(prev => ({ ...prev, month: value }))}
                  allowClear
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <Option key={i + 1} value={i + 1}>
                      {i + 1}月
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={4}>
                <Select
                  placeholder="日期"
                  style={{ width: '100%' }}
                  value={searchParams.day}
                  onChange={value => setSearchParams(prev => ({ ...prev, day: value }))}
                  allowClear
                >
                  {Array.from({ length: 31 }, (_, i) => (
                    <Option key={i + 1} value={i + 1}>
                      {i + 1}日
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={6}>
                <Space>
                  <Button 
                    type="primary" 
                    icon={<FilterOutlined />}
                    onClick={fetchData}
                  >
                    篩選
                  </Button>
                  <Button onClick={handleReset}>
                    重置
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          {/* 數據表格 */}
          <Table
            columns={columns}
            dataSource={worklogList}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 條，共 ${total} 條記錄`,
            }}
            onChange={(pag) => setPagination(pag)}
            rowKey="id"
            scroll={{ x: 1200 }}
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
            title={<span style={{ color: '#e2e8f0' }}>工作日誌詳情</span>}
            width={800}
            footer={null}
            onCancel={() => setDetailVisible(false)}
            styles={{
              content: {
                background: 'rgba(15, 23, 42, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(148, 163, 184, 0.1)',
                borderRadius: '8px',
              },
              header: {
                background: 'rgba(15, 23, 42, 0.5)',
                borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                padding: '16px 24px',
                marginBottom: '8px',
              },
              body: {
                padding: '24px',
              },
            }}
            modalRender={modal => (
              <div style={{ 
                background: 'rgba(15, 23, 42, 0.95)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                {modal}
              </div>
            )}
          >
            {currentRecord && (
              <div className="detail-content" style={{ color: '#e2e8f0' }}>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <p><strong style={{ color: '#94a3b8' }}>員工：</strong>{currentRecord.employeeName}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong style={{ color: '#94a3b8' }}>員工編號：</strong>{currentRecord.employeeNumber}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong style={{ color: '#94a3b8' }}>日誌日期：</strong>{dayjs(currentRecord.logDate).format('YYYY-MM-DD')}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong style={{ color: '#94a3b8' }}>分類：</strong>{currentRecord.categoryName || '無'}</p>
                  </Col>
                  <Col span={24}>
                    <p><strong style={{ color: '#94a3b8' }}>標題：</strong>{currentRecord.title}</p>
                  </Col>
                  <Col span={24}>
                    <p style={{ marginBottom: '12px' }}><strong style={{ color: '#94a3b8' }}>內容：</strong></p>
                    <div style={{ 
                      background: 'rgba(30, 41, 59, 0.8)',
                      padding: '16px',
                      borderRadius: '8px',
                      minHeight: '100px',
                      whiteSpace: 'pre-wrap',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      color: '#e2e8f0',
                      marginTop: '8px'
                    }}>
                      {currentRecord.content || '無內容'}
                    </div>
                  </Col>
                  {currentRecord.tags && (
                    <Col span={24}>
                      <p><strong style={{ color: '#94a3b8' }}>標籤：</strong>{currentRecord.tags}</p>
                    </Col>
                  )}
                  <Col span={12}>
                    <p><strong style={{ color: '#94a3b8' }}>狀態：</strong>{getStatusTag(currentRecord.status)}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong style={{ color: '#94a3b8' }}>積分：</strong>{currentRecord.pointsClaimed || 0}</p>
                  </Col>
                  <Col span={12}>
                    <p><strong style={{ color: '#94a3b8' }}>創建時間：</strong>{dayjs(currentRecord.createdAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                  </Col>
                  {currentRecord.updatedAt && (
                    <Col span={12}>
                      <p><strong style={{ color: '#94a3b8' }}>更新時間：</strong>{dayjs(currentRecord.updatedAt).format('YYYY-MM-DD HH:mm:ss')}</p>
                    </Col>
                  )}
                  <Col span={12}>
                    {(() => {
                      const editCount = workLogAPI.getWorkLogEditCount(currentRecord.id);
                      const remainingEdits = 2 - editCount;
                      return (
                        <p>
                          <strong style={{ color: '#94a3b8' }}>編輯狀態：</strong>
                          <span style={{ 
                            color: remainingEdits > 0 ? '#94a3b8' : '#ef4444',
                            marginLeft: '4px'
                          }}>
                            {remainingEdits > 0 
                              ? `已編輯 ${editCount} 次，剩餘 ${remainingEdits} 次編輯機會`
                              : '已達編輯次數上限'}
                          </span>
                        </p>
                      );
                    })()}
                  </Col>
                  {currentRecord.reviewComments && (
                    <Col span={24}>
                      <p><strong style={{ color: '#94a3b8' }}>審核意見：</strong></p>
                      <div style={{ 
                        background: 'rgba(30, 41, 59, 0.8)',
                        padding: '16px',
                        borderRadius: '8px',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        color: '#e2e8f0'
                      }}>
                        {currentRecord.reviewComments}
                      </div>
                    </Col>
                  )}
                </Row>
              </div>
            )}
          </Modal>
        </Card>
      </div>
    </div>
  );
};

export default WorkLogBrowse;

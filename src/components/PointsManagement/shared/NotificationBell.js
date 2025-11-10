import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { notificationAPI } from '../../../services/notificationAPI';

const NotificationBell = ({ currentUser }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // 獲取未讀通知數量
  const loadUnreadCount = async () => {
    if (!currentUser?.id) {
      console.log('NotificationBell: 沒有用戶ID，跳過載入通知');
      return;
    }
    
    console.log('NotificationBell: 開始載入未讀通知數量，用戶ID:', currentUser.id);
    
    try {
      const count = await notificationAPI.getUnreadCount(currentUser.id);
      console.log('NotificationBell: 成功獲取未讀通知數量:', count);
      setUnreadCount(count);
    } catch (error) {
      console.error('NotificationBell: 獲取未讀通知數量失敗:', error);
      console.error('NotificationBell: 錯誤詳情:', {
        message: error.message,
        stack: error.stack,
        userId: currentUser.id
      });
    }
  };

  // 獲取通知列表
  const loadNotifications = async () => {
    if (!currentUser?.id) return;
    
    setLoading(true);
    try {
      const notifications = await notificationAPI.getUserNotifications(currentUser.id, false, 20);
      setNotifications(notifications);
    } catch (error) {
      console.error('獲取通知列表失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 標記單個通知為已讀
  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId, currentUser.id);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      await loadUnreadCount();
    } catch (error) {
      console.error('標記通知已讀失敗:', error);
    }
  };

  // 標記所有通知為已讀
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead(currentUser.id);
      setNotifications(prev => 
        prev.map(n => ({ ...n, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('標記所有通知已讀失敗:', error);
    }
  };

  // 處理點擊事件
  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      loadNotifications();
    }
  };

  // 處理通知點擊跳轉
  const handleNotificationClick = async (notification) => {
    // 標記為已讀
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // 根據通知類型進行跳轉
    if (notification.type === 'points_submitted' && notification.relatedEntityId) {
      console.log('開始處理通知跳轉，積分項目ID:', notification.relatedEntityId);
      
      // 策略1: 首先嘗試直接查找積分項目（如果已經展開）
      let targetElement = document.getElementById(`submission-${notification.relatedEntityId}`);
      
      if (!targetElement) {
        console.log('積分項目未渲染，查找對應的員工組別...');
        
        // 策略2: 查找所有員工組別，通過通知內容推斷是哪個員工
        const allEmployeeGroups = document.querySelectorAll('[data-employee-group]');
        console.log('找到員工組別數量:', allEmployeeGroups.length);
        
        // 從通知內容中提取員工姓名（假設格式為 "XXX 提交了..."）
        const notificationContent = notification.content || '';
        const employeeNameMatch = notificationContent.match(/^([^\s]+)\s+提交了/);
        const employeeName = employeeNameMatch ? employeeNameMatch[1] : null;
        
        console.log('從通知內容提取員工姓名:', employeeName);
        console.log('通知完整內容:', notificationContent);
        
        let targetGroup = null;
        
        // 遍歷所有員工組別，查找匹配的員工
        if (employeeName) {
          for (let group of allEmployeeGroups) {
            const groupHeader = group.querySelector('.cursor-pointer');
            if (groupHeader) {
              const nameElement = groupHeader.querySelector('.font-medium.text-white');
              if (nameElement && nameElement.textContent.includes(employeeName)) {
                targetGroup = group;
                console.log('找到匹配的員工組別:', nameElement.textContent);
                break;
              }
            }
          }
        }
        
        // 策略3: 如果找不到匹配的組別，展開所有收合的組別
        if (!targetGroup) {
          console.log('無法匹配特定員工，嘗試展開所有收合的組別...');
          
          const groupsToExpand = [];
          for (let group of allEmployeeGroups) {
            const groupHeader = group.querySelector('.cursor-pointer');
            if (groupHeader) {
              // 檢查是否已展開 - 使用更精確的方式
              let isExpanded = false;
              const expandIndicator = groupHeader.querySelector('.text-slate-400.text-sm');
              
              if (expandIndicator) {
                const indicatorText = expandIndicator.textContent.trim();
                isExpanded = indicatorText === '▼';
              }
              
              if (!isExpanded) {
                groupsToExpand.push(groupHeader);
              }
            }
          }
          
          console.log('需要展開的組別數量:', groupsToExpand.length);
          
          // 依次展開所有收合的組別
          for (let header of groupsToExpand) {
            header.click();
            await new Promise(resolve => setTimeout(resolve, 300)); // 延長延遲時間
          }
          
          if (groupsToExpand.length > 0) {
            // 等待所有展開動畫完成 - 增加等待時間
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 重新查找積分項目
            targetElement = document.getElementById(`submission-${notification.relatedEntityId}`);
            console.log('展開所有組別後重新查找積分項目:', targetElement ? '找到' : '未找到');
            
            // 如果還是找不到，再等待一下並重試
            if (!targetElement) {
              console.log('展開所有組別後第一次查找失敗，再次重試...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              targetElement = document.getElementById(`submission-${notification.relatedEntityId}`);
              console.log('展開所有組別後第二次查找結果:', targetElement ? '找到' : '未找到');
            }
          }
        } else {
          // 找到特定組別，檢查並展開
          const groupHeader = targetGroup.querySelector('.cursor-pointer');
          
          if (groupHeader) {
            // 檢查是否已展開 - 更精確的檢查方式
            let isExpanded = false;
            const expandIndicator = groupHeader.querySelector('.text-slate-400.text-sm');
            
            if (expandIndicator) {
              const indicatorText = expandIndicator.textContent.trim();
              isExpanded = indicatorText === '▼';
              console.log('當前展開狀態指示符:', indicatorText, '是否已展開:', isExpanded);
            }
            
            // 如果沒有展開，先點擊展開
            if (!isExpanded) {
              console.log('自動展開目標員工組別...');
              
              // 觸發點擊事件
              groupHeader.click();
              
              // 等待更長時間確保DOM完全更新
              await new Promise(resolve => setTimeout(resolve, 800));
              
              // 驗證展開狀態
              const newIndicator = groupHeader.querySelector('.text-slate-400.text-sm');
              if (newIndicator) {
                const newIndicatorText = newIndicator.textContent.trim();
                console.log('展開後狀態指示符:', newIndicatorText);
              }
              
              // 重新查找積分項目
              targetElement = document.getElementById(`submission-${notification.relatedEntityId}`);
              console.log('展開目標組別後重新查找積分項目:', targetElement ? '找到' : '未找到');
              
              // 如果還是找不到，再等待一下並重試
              if (!targetElement) {
                console.log('第一次查找失敗，等待更長時間後重試...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                targetElement = document.getElementById(`submission-${notification.relatedEntityId}`);
                console.log('第二次查找結果:', targetElement ? '找到' : '未找到');
              }
            } else {
              console.log('目標員工組別已經展開');
              // 重新查找積分項目
              targetElement = document.getElementById(`submission-${notification.relatedEntityId}`);
              console.log('組別已展開，查找積分項目:', targetElement ? '找到' : '未找到');
            }
          }
        }
      }
      
      // 如果精確ID匹配失敗，嘗試智能匹配
      if (!targetElement) {
        console.log('無法找到精確ID匹配的積分項目，ID:', notification.relatedEntityId);
        
        // 調試：檢查DOM中實際存在的submission IDs
        const allSubmissions = document.querySelectorAll('[id^="submission-"]');
        const existingIds = Array.from(allSubmissions).map(el => el.id);
        console.log('DOM中實際存在的積分項目IDs:', existingIds);
        console.log('查找的目標ID:', `submission-${notification.relatedEntityId}`);
        
        // 智能匹配：當精確ID不存在時，嘗試找到同員工的任一積分項目
        if (allSubmissions.length > 0 && notification.content) {
          console.log('嘗試智能匹配同員工的積分項目...');
          
          // 從通知內容中提取員工姓名
          const employeeNameMatch = notification.content.match(/^([^\s]+)\s+提交了/);
          const employeeName = employeeNameMatch ? employeeNameMatch[1] : null;
          
          if (employeeName) {
            console.log('智能匹配目標員工:', employeeName);
            
            // 在當前展開的積分項目中查找匹配的員工
            for (let submissionElement of allSubmissions) {
              // 向上查找到員工組別容器
              let employeeGroup = submissionElement.closest('[data-employee-group]');
              if (employeeGroup) {
                const nameElement = employeeGroup.querySelector('.font-medium.text-white');
                if (nameElement && nameElement.textContent.includes(employeeName)) {
                  console.log('智能匹配成功，找到員工的積分項目:', submissionElement.id);
                  targetElement = submissionElement;
                  break;
                }
              }
            }
            
            if (targetElement) {
              console.log('智能匹配成功，將使用該積分項目進行跳轉');
            } else {
              console.log('智能匹配失敗，未找到該員工的積分項目');
            }
          }
        }
      }

      // 最終跳轉邏輯
      if (targetElement) {
        console.log('執行跳轉到積分項目');
        
        // 找到積分項目的可點擊元素並模擬點擊來選中它
        const clickableElement = targetElement.querySelector('.text-sm.text-white.font-medium.cursor-pointer');
        if (clickableElement) {
          console.log('模擬點擊選中積分項目');
          
          // 等待短暫時間確保DOM完全渲染
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // 觸發點擊事件
          clickableElement.click();
          
          console.log('已觸發積分項目選中事件');
        } else {
          console.log('未找到可點擊的積分項目元素');
          
          // 調試：查看目標元素的結構
          console.log('目標元素HTML:', targetElement.outerHTML);
          
          // 嘗試查找其他可能的點擊元素
          const allClickable = targetElement.querySelectorAll('[onclick], .cursor-pointer');
          console.log('目標元素內所有可點擊元素:', allClickable.length);
          
          if (allClickable.length > 0) {
            console.log('嘗試點擊找到的可點擊元素');
            allClickable[0].click();
          }
        }
        
        // 滾動到對應項目並高亮
        targetElement.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // 高亮顯示該項目
        targetElement.classList.add('highlight-submission');
        setTimeout(() => {
          targetElement.classList.remove('highlight-submission');
        }, 3000);
        
        console.log('已跳轉至積分項目，ID:', targetElement.id || notification.relatedEntityId);
      } else {
        console.log('所有匹配策略都失敗，請確保當前在主管審核頁面，且數據已加載完成');
      }
    }
    
    // 關閉通知面板
    setIsOpen(false);
  };

  // 處理點擊外部關閉
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 定期刷新未讀數量
  useEffect(() => {
    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 30000); // 每30秒刷新一次
    return () => clearInterval(interval);
  }, [currentUser?.id]);

  // 格式化時間
  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return '剛剛';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分鐘前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}小時前`;
    return `${Math.floor(diffInSeconds / 86400)}天前`;
  };

  // 獲取通知圖標
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'points_submitted':
        return '📝';
      case 'points_approved':
        return '✅';
      case 'points_rejected':
        return '❌';
      case 'system_notice':
        return '📢';
      default:
        return '🔔';
    }
  };

  // 獲取優先級顏色
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-400';
      case 'high':
        return 'border-l-orange-400';
      case 'normal':
        return 'border-l-blue-400';
      case 'low':
        return 'border-l-gray-400';
      default:
        return 'border-l-blue-400';
    }
  };

  if (!currentUser?.id) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知鈴鐺 */}
      <button
        onClick={handleBellClick}
        className="relative p-2 text-white hover:text-blue-300 transition-colors"
      >
        {/* 水波紋動畫效果 */}
        {unreadCount > 0 && (
          <>
            <div className="absolute inset-0 rounded-full animate-ping bg-red-400 opacity-75"></div>
            <div className="absolute inset-0 rounded-full animate-pulse bg-red-300 opacity-50"></div>
          </>
        )}
        <Bell className="h-6 w-6 relative z-10" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center min-w-[20px] z-20 animate-bounce">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉列表 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[90vw] sm:w-96 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-[9999] max-h-[85vh] overflow-hidden"
             style={{ maxWidth: '400px' }}>
          {/* 標題欄 */}
          <div className="p-4 border-b border-slate-600 flex items-center justify-between">
            <h3 className="text-white font-semibold">通知中心</h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-blue-400 hover:text-blue-300 text-sm flex items-center"
                >
                  <CheckCheck className="h-4 w-4 mr-1" />
                  全部已讀
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* 通知列表 */}
          <div className="max-h-[60vh] sm:max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-slate-400">
                載入中...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-slate-400">
                暫無通知
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-slate-700 hover:bg-slate-700/50 cursor-pointer transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                    !notification.isRead ? 'bg-slate-700/30' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-lg flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className={`text-sm font-medium ${notification.isRead ? 'text-slate-300' : 'text-white'}`}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-blue-400 hover:text-blue-300 ml-2 flex-shrink-0"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className={`text-xs mt-1 ${notification.isRead ? 'text-slate-400' : 'text-slate-300'}`}>
                        {notification.content}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 底部 */}
          {notifications.length > 0 && (
            <div className="p-3 bg-slate-700/50 text-center">
              <span className="text-xs text-slate-400">
                顯示最近 {notifications.length} 條通知
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 
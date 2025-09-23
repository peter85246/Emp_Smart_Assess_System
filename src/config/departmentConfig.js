// 部門權限配置
export const departmentConfig = {
  // 高階管理層判定（包括管理者）
  isHighLevelPosition: (role_name) => {
    return ['董事長', '負責人', '總經理', '執行長', '管理者'].includes(role_name);
  },

  // 部門主管判定
  isDepartmentHead: (role_name) => {
    return role_name === '技師';
  },

  // 權限檢查
  canViewUserData: (currentUser, targetUser) => {
    if (!currentUser || !targetUser) return false;

    // 高階管理層（包括管理者）可以看所有人
    if (departmentConfig.isHighLevelPosition(currentUser.role_name)) {
      return true;
    }

    // 自己可以看自己
    if (currentUser.user_name === targetUser.user_name) {
      return true;
    }

    // 技師可以看到加工和檢驗部門的員工
    if (currentUser.role_name === '技師') {
      const viewableRoles = ['加工', '檢驗'];
      return viewableRoles.includes(targetUser.role_name);
    }

    return false;
  },

  // 獲取用戶可讀性高的顯示名稱
  getUserDisplayName: (user) => {
    if (!user) return '未登入';
    return `${user.user_name} (${user.role_name})`;
  }
};
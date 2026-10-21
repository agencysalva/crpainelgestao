import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { User, UserRole } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: {
    name: string;
    username: string;
    password: string;
    confirmPassword?: string;
    jobTitle?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => void;
  switchQuickRole: (role: UserRole) => Promise<void>;
  hasRole: (roles: UserRole[]) => boolean;
  updateAvatar: (avatarBase64: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  syncUserFromRemote: (remoteUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface DemoCredential {
  username: string;
  email: string;
  pass: string;
  label: string;
  roleName: string;
}

// O sistema possui EXCLUSIVAMENTE dois perfis: Administrador e Funcionário.
export const DEMO_CREDENTIALS: Record<UserRole, DemoCredential> = {
  admin: {
    username: 'Cristiano',
    email: 'cristiano@crservicosgerais.com.br',
    pass: 'Cristiano2026',
    label: 'Cristiano Ramos (Administrador)',
    roleName: 'Administrador',
  },
  employee: {
    username: 'func01',
    email: 'func01@crservicosgerais.com.br',
    pass: '123456',
    label: 'Juliana Paes (Funcionária)',
    roleName: 'Funcionário',
  },
  // Mapeamentos para manter compatibilidade
  manager: {
    username: 'Cristiano',
    email: 'cristiano@crservicosgerais.com.br',
    pass: 'Cristiano2026',
    label: 'Cristiano Ramos (Administrador)',
    roleName: 'Administrador',
  },
  technician: {
    username: 'func01',
    email: 'func01@crservicosgerais.com.br',
    pass: '123456',
    label: 'Juliana Paes (Funcionária)',
    roleName: 'Funcionário',
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredUser() {
      const token = localStorage.getItem('cr_auth_token');
      if (token) {
        try {
          const res = await api.getMe();
          const u = res.user;
          // Se o usuário não tiver avatar no servidor ou for placeholder, recupera do localStorage
          const cachedAvatar = localStorage.getItem(`cr_avatar_${u.id}`);
          if (cachedAvatar && (!u.avatar || u.avatar.length < 200)) {
            u.avatar = cachedAvatar;
          } else if (u.avatar && u.avatar.length > 200) {
            localStorage.setItem(`cr_avatar_${u.id}`, u.avatar);
          }
          setUser(u);
        } catch {
          localStorage.removeItem('cr_auth_token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    }
    loadStoredUser();
  }, []);

  const login = useCallback(async (emailOrUsername: string, password?: string) => {
    const res = await api.login(emailOrUsername, password || 'admin');
    localStorage.setItem('cr_auth_token', res.token);
    const u = res.user;
    const cachedAvatar = localStorage.getItem(`cr_avatar_${u.id}`);
    if (cachedAvatar && (!u.avatar || u.avatar.length < 200)) {
      u.avatar = cachedAvatar;
    } else if (u.avatar && u.avatar.length > 200) {
      localStorage.setItem(`cr_avatar_${u.id}`, u.avatar);
    }
    setUser(u);
  }, []);

  const register = useCallback(async (data: {
    name: string;
    username: string;
    password: string;
    confirmPassword?: string;
    jobTitle?: string;
    phone?: string;
  }) => {
    const res = await api.register(data);
    localStorage.setItem('cr_auth_token', res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('cr_auth_token');
    setUser(null);
  }, []);

  const switchQuickRole = useCallback(async (role: UserRole) => {
    const targetRole: UserRole = role === 'admin' || role === 'manager' ? 'admin' : 'employee';
    const cred = DEMO_CREDENTIALS[targetRole];
    try {
      await login(cred.username, cred.pass);
    } catch {
      try {
        await login(cred.email, cred.pass);
      } catch {
        await login(targetRole, cred?.pass || '123456');
      }
    }
  }, [login]);

  const hasRole = useCallback((roles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'admin' || user.role === 'manager') return true;
    return roles.includes(user.role);
  }, [user]);

  const updateAvatar = useCallback(async (avatarBase64: string) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      try {
        if (avatarBase64) {
          localStorage.setItem(`cr_avatar_${currentUser.id}`, avatarBase64);
        } else {
          localStorage.removeItem(`cr_avatar_${currentUser.id}`);
        }
      } catch {}
      return { ...currentUser, avatar: avatarBase64 };
    });

    try {
      const updatedUser = await api.updateProfileAvatar(avatarBase64);
      setUser(updatedUser);
    } catch {
      if (user) {
        const updatedUser = await api.updateUser(user.id, { avatar: avatarBase64 });
        setUser(updatedUser);
      }
    }
  }, [user]);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!user) return;
    const updatedUser = await api.updateUser(user.id, data);
    setUser(updatedUser);
  }, [user]);

  const syncUserFromRemote = useCallback((remoteUser: User) => {
    setUser((curr) => {
      if (!curr || curr.id !== remoteUser.id) return curr;
      const avatar = remoteUser.avatar && remoteUser.avatar.length > 200
        ? remoteUser.avatar
        : curr.avatar;

      if (
        curr.avatar === avatar &&
        curr.name === remoteUser.name &&
        curr.email === remoteUser.email &&
        curr.role === remoteUser.role &&
        curr.phone === remoteUser.phone &&
        curr.jobTitle === remoteUser.jobTitle &&
        curr.active === remoteUser.active
      ) {
        return curr;
      }

      if (avatar && avatar.length > 200) {
        try {
          localStorage.setItem(`cr_avatar_${curr.id}`, avatar);
        } catch {}
      }
      return {
        ...curr,
        ...remoteUser,
        avatar
      };
    });
  }, []);

  const authContextValue = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    switchQuickRole,
    hasRole,
    updateAvatar,
    updateProfile,
    syncUserFromRemote,
  }), [user, loading, login, register, logout, switchQuickRole, hasRole, updateAvatar, updateProfile, syncUserFromRemote]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

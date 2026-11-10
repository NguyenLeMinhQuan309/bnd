import React, { createContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  ChangePasswordRequest,
} from "../types";
import { authService } from "../services/authService";

const isAuthUser = (value: unknown): value is AuthUser =>
  typeof value === "object" &&
  value !== null &&
  "code" in value &&
  typeof value.code === "string" &&
  value.code.length > 0;

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (customer: any) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  clearError: () => void;
  setUserFromBarcode: (userData: AuthUser) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      try {
        const savedUser =
          (await AsyncStorage.getItem("authUser")) ??
          (await AsyncStorage.getItem("userData")) ??
          (await AsyncStorage.getItem("user"));

        if (savedUser) {
          const parsedUser: unknown = JSON.parse(savedUser);
          if (isAuthUser(parsedUser)) {
            if (isMounted) {
              setUser(parsedUser);
              setToken(await AsyncStorage.getItem("authToken"));
            }

            await AsyncStorage.setItem("authUser", JSON.stringify(parsedUser));
          } else {
            await AsyncStorage.multiRemove(["authUser", "authToken"]);
          }
        }
      } catch (err) {
        console.error("Failed to restore login session:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (customer: any) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log("Customer data:", customer);

      const response = await authService.login(customer);
      await AsyncStorage.multiSet([
        ["authUser", JSON.stringify(response.user)],
        ["authToken", response.token],
      ]);
      setUser(response.user);
      setToken(response.token);
      console.log("User logged in:", response.user);
    } catch (err: any) {
      const errorMessage = err.message || "Login failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.register(userData);
      await AsyncStorage.multiSet([
        ["authUser", JSON.stringify(response.user)],
        ["authToken", response.token],
      ]);
      setUser(response.user);
      setToken(response.token);
    } catch (err: any) {
      const errorMessage = err.message || "Registration failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);

      // Call logout endpoint if needed
      if (token) {
        try {
          await authService.logout();
        } catch (err) {
          console.warn("Logout endpoint failed:", err);
        }
      }

      await AsyncStorage.multiRemove([
        "authToken",
        "authUser",
        "user",
        "userData",
      ]);
      setUser(null);
      setToken(null);
    } catch (err: any) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  const changePassword = useCallback(async (data: ChangePasswordRequest) => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.changePassword(data);
    } catch (err: any) {
      const errorMessage = err.message || "Change password failed";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const setUserFromBarcode = useCallback(async (userData: AuthUser) => {
    console.log("Setting user from barcode:", userData);
    await AsyncStorage.setItem("authUser", JSON.stringify(userData));
    await AsyncStorage.removeItem("authToken");
    setUser(userData);
    setToken(null);
  }, []);

  useEffect(() => {
    console.log("User:", user);
  }, [user]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    changePassword,
    clearError,
    setUserFromBarcode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

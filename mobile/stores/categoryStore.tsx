import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from "react";

import { getErrorMessage } from "../services/api";
import { getCategories as fetchCategories } from "../services/categories";
import { Category } from "../types";
import { useAuth } from "./authStore";

interface CategoryContextValue {
  categories: Category[];
  selectedCategoryId: number | null;
  isLoading: boolean;
  error: string | null;
  loadCategories: () => Promise<void>;
  selectCategory: (categoryId: number | null) => void;
}

const CategoryContext = createContext<CategoryContextValue | undefined>(undefined);

export function CategoryProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    if (!isAuthenticated) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetchCategories();
      setCategories(response);
      setError(null);
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setCategories([]);
      setSelectedCategoryId(null);
      setError(null);
      return;
    }

    void loadCategories();
  }, [isAuthenticated, loadCategories]);

  const selectCategory = (categoryId: number | null) => {
    setSelectedCategoryId((currentId) => (currentId === categoryId ? null : categoryId));
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        selectedCategoryId,
        isLoading,
        error,
        loadCategories,
        selectCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);

  if (!context) {
    throw new Error("useCategories must be used within CategoryProvider");
  }

  return context;
}

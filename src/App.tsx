import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Todo } from "./types";
import WelcomeMessage from "./WelcomeMessage";
import TodoList from "./TodoList";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTriangleExclamation,
  faMoon,
  faSun,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

// Todoの型

interface FormState {
  name: string;
  priority: number;
  deadline: Date | null;
}

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

const initialFormState: FormState = {
  name: "",
  priority: 3,
  deadline: null,
};

// バリデーション関数
const validateForm = (name: string) => {
  const errors: { [key: string]: string } = {};
  if (name.length < 2 || name.length > 32) {
    errors.name = "2文字以上、32文字以内で入力してください";
  }
  return errors;
};

const App = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const localStorageKey = "TodoApp";

  // トースト表示
  const showToast = useCallback(
    (message: string, type: Toast["type"] = "info") => {
      const newToast = { id: uuid(), message, type };
      setToasts((prev) => [...prev, newToast]);
      setTimeout(
        () =>
          setToasts((prev) => prev.filter((toast) => toast.id !== newToast.id)),
        3000
      );
    },
    []
  );

  // トースト削除
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // ダークモード切り替え
  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  // Todoのソート処理
  useEffect(() => {
    const sortedTodos = [...todos].sort((a, b) => {
      // 期限がある場合は期限順でソート
      if (a.deadline && b.deadline) {
        return a.deadline < b.deadline ? -1 : 1;
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;

      // 期限がない場合は優先度順でソート
      return a.priority - b.priority;
    });

    setTodos(sortedTodos);
  }, [todos]);

  // ローカルストレージからTodosを読み込む
  useEffect(() => {
    const loadTodos = async () => {
      try {
        const todoJsonStr = localStorage.getItem(localStorageKey);
        if (todoJsonStr && todoJsonStr !== "[]") {
          const storedTodos: Todo[] = JSON.parse(todoJsonStr);
          const convertedTodos = storedTodos.map((todo) => ({
            ...todo,
            deadline: todo.deadline ? new Date(todo.deadline) : null,
          }));
          setTodos(convertedTodos);
        }
      } catch (error) {
        showToast("データの読み込みに失敗しました", "error");
      } finally {
        setIsLoading(false);
      }
    };

    loadTodos();
  }, [showToast]);

  // TodosをlocalStorageに保存
  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem(localStorageKey, JSON.stringify(todos));
    }
  }, [todos]);

  // 未完了タスク数の算出
  const uncompletedCount = useMemo(
    () => todos.filter((todo) => !todo.isDone).length,
    [todos]
  );

  // 入力変更ハンドラ
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type } = e.target;
      setFormState((prev) => ({
        ...prev,
        [name]: type === "radio" ? Number(value) : value,
      }));

      if (name === "name") {
        const errors = validateForm(value);
        setFormErrors(errors);
      }
    },
    []
  );
  // セレクト変更ハンドラ（選択肢選択用）
  const handleSelectChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormState((prev) => ({
        ...prev,
        [name]: Number(value), // 優先度は数値として扱うため、Number()で変換
      }));
    },
    []
  );
  // 期限変更ハンドラ
  const handleDeadlineChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const dt = e.target.value;
      setFormState((prev) => ({
        ...prev,
        deadline: dt === "" ? null : new Date(dt),
      }));
    },
    []
  );

  // 新しいタスクの追加
  const addNewTodo = useCallback(() => {
    const errors = validateForm(formState.name);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const newTodo: Todo = {
      id: uuid(),
      name: formState.name,
      isDone: false,
      priority: formState.priority,
      deadline: formState.deadline,
    };

    setTodos((prev) => [...prev, newTodo]);
    setFormState(initialFormState);
    setFormErrors({});
    showToast("新しいタスクを追加しました", "success");
  }, [formState, showToast]);

  // 完了状態の更新
  const updateIsDone = useCallback((id: string, value: boolean) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, isDone: value } : todo))
    );
  }, []);

  // タスクの削除
  const remove = useCallback(
    (id: string) => {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      showToast("タスクを削除しました", "info");
    },
    [showToast]
  );

  // 完了済みタスクの削除
  const removeCompletedTodos = useCallback(() => {
    setTodos((prev) => prev.filter((todo) => !todo.isDone));
    showToast("完了済みのタスクを削除しました", "info");
  }, [showToast]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }
  const containerClasses = twMerge(
    "min-h-screen w-full bg-white transition-colors duration-200",
    isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900"
  );

  return (
    <div className={containerClasses}>
      <div className="mx-4 mt-10 max-w-2xl md:mx-auto">
        {/* トースト通知 */}
        <div className="fixed bottom-4 right-4 z-50 space-y-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={twMerge(
                "flex items-center justify-between rounded-lg px-4 py-2 text-white shadow-lg",
                toast.type === "success" && "bg-green-500",
                toast.type === "error" && "bg-red-500",
                toast.type === "info" && "bg-blue-500"
              )}
            >
              <span>{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="ml-2 rounded-full p-1 hover:bg-white/20"
              >
                <FontAwesomeIcon icon={faXmark} className="size-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <h1
            className={`mb-4 text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            TodoApp
          </h1>
          <button
            onClick={toggleDarkMode}
            className={`rounded-full p-2 ${isDarkMode ? "text-white hover:bg-gray-700" : "text-gray-900 hover:bg-gray-300"}`}
          >
            <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
          </button>
        </div>

        {/* Todoリストの追加フォーム */}
        <div className="mb-4">
          <div className="mb-2">
            <input
              type="text"
              name="name"
              value={formState.name}
              onChange={handleInputChange}
              className={`w-full rounded-md border px-4 py-2 ${
                formErrors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="タスク名"
            />
            {formErrors.name && (
              <p className="text-sm text-red-500">{formErrors.name}</p>
            )}
          </div>

          <div className="mb-2 flex">
            <select
              name="priority"
              value={formState.priority}
              onChange={handleSelectChange}
              className="mr-2 rounded-md border border-gray-300 px-4 py-2"
            >
              <option value={1}>優先度 1</option>
              <option value={2}>優先度 2</option>
              <option value={3}>優先度 3</option>
            </select>

            <input
              type="date"
              name="deadline"
              value={
                formState.deadline
                  ? dayjs(formState.deadline).format("YYYY-MM-DD")
                  : ""
              }
              onChange={handleDeadlineChange}
              className="rounded-md border border-gray-300 px-4 py-2"
            />
          </div>

          <button
            onClick={addNewTodo}
            className="w-full rounded-md bg-blue-500 py-2 text-white hover:bg-blue-700"
          >
            タスクを追加
          </button>
        </div>

        {/* Todoリスト */}
        <TodoList todos={todos} updateIsDone={updateIsDone} remove={remove} />

        {/* 完了済みタスクの削除 */}
        {todos.some((todo) => todo.isDone) && (
          <button
            onClick={removeCompletedTodos}
            className="mt-4 w-full rounded-md bg-red-500 py-2 text-white hover:bg-red-700"
          >
            完了済みタスクを削除
          </button>
        )}

        {/* 未完了タスク数 */}
        <div className="mt-4 text-lg font-semibold text-gray-800">
          残りタスク数: {uncompletedCount}
        </div>
      </div>
    </div>
  );
};

export default App;

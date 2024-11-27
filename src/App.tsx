import React, { useState, useCallback, useEffect, useMemo } from "react";
import { Todo } from "./types";
import TodoList from "./TodoList";
import { v4 as uuid } from "uuid";
import dayjs from "dayjs";
import { twMerge } from "tailwind-merge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

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

const App = () => {
  const updateIsDone = (id: string, value: boolean) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, isDone: value } : todo
      )
    );
  };

  // 編集状態をキャンセルする関数
  const cancelEditing = (id: string) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, isEditing: false } : todo
      )
    );
  };

  // 編集中のタスクを更新する関数
  const updateTodo = (id: string, updatedTodo: Partial<Omit<Todo, "id">>) => {
    setTodos((prevTodos) =>
      prevTodos.map((todo) =>
        todo.id === id ? { ...todo, ...updatedTodo } : todo
      )
    );
  };
  const [isDarkMode, setIsDarkMode] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [todos, setTodos] = useState<Todo[]>([]);
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null); // 編集中のタスクID
  const [toasts, setToasts] = useState<Toast[]>([]);

  const localStorageKey = "TodoApp";

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

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

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

    setTodos((prev) => {
      const updatedTodos = [...prev, newTodo];
      return updatedTodos.sort((a, b) => {
        if (a.deadline && b.deadline) return a.deadline < b.deadline ? -1 : 1;
        if (a.deadline) return -1;
        if (b.deadline) return 1;
        return a.priority - b.priority;
      });
    });

    setFormState(initialFormState);
    setFormErrors({});
    showToast("新しいタスクを追加しました", "success");
  }, [formState, showToast]);

  // 編集用のフォームを表示する
  const startEditing = (id: string) => {
    setEditingTodoId(id);
    const todo = todos.find((todo) => todo.id === id);
    if (todo) {
      setFormState({
        name: todo.name,
        priority: todo.priority,
        deadline: todo.deadline,
      });
    }
  };

  // 編集内容を保存する
  const saveEdit = () => {
    if (editingTodoId) {
      setTodos((prev) =>
        prev.map((todo) => {
          if (todo.id === editingTodoId) {
            return { ...todo, ...formState };
          }
          return todo;
        })
      );
      setEditingTodoId(null);
      showToast("タスクを更新しました", "success");
    }
  };

  // 編集をキャンセルする
  const cancelEdit = () => {
    setEditingTodoId(null);
    setFormState(initialFormState);
  };

  // タスク削除
  const remove = useCallback(
    (id: string) => {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      showToast("タスクを削除しました", "info");
    },
    [showToast]
  );

  const removeCompletedTodos = useCallback(() => {
    setTodos((prev) => prev.filter((todo) => !todo.isDone));
    showToast("完了済みタスクを削除しました", "info");
  }, [showToast]);

  const validateForm = (name: string) => {
    const errors: { [key: string]: string } = {};
    if (name.length < 2 || name.length > 32) {
      errors.name = "2文字以上、32文字以内で入力してください";
    }
    return errors;
  };

  const uncompletedCount = useMemo(
    () => todos.filter((todo) => !todo.isDone).length,
    [todos]
  );

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

  useEffect(() => {
    if (todos.length > 0) {
      localStorage.setItem(localStorageKey, JSON.stringify(todos));
    }
  }, [todos]);

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
      {/* ダークモード切り替えとタイトル */}
      <div className="flex items-center justify-between p-4">
        <h1 className="text-2xl font-bold">TodoApp</h1>
        <button
          onClick={toggleDarkMode}
          className={`rounded-full p-2 ${isDarkMode ? "text-white hover:bg-gray-700" : "text-gray-900 hover:bg-gray-300"}`}
        >
          <FontAwesomeIcon icon={isDarkMode ? faSun : faMoon} />
        </button>
      </div>

      {/* タスクリスト */}
      <TodoList
        todos={todos}
        updateIsDone={updateIsDone}
        remove={remove}
        startEditing={startEditing}
        cancelEditing={cancelEditing}
        updateTodo={updateTodo}
      />

      {/* タスク追加フォーム */}
      <div className="mx-4 mt-10 max-w-2xl md:mx-auto">
        {editingTodoId ? (
          <div className="mb-4">
            <h2 className="text-xl font-bold">タスク編集</h2>
            <input
              type="text"
              value={formState.name}
              className="mt-2 w-full rounded-md border p-2"
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <div className="mt-4 flex items-center">
              <select
                value={formState.priority}
                className="w-full rounded-md border p-2"
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    priority: Number(e.target.value),
                  }))
                }
              >
                <option value={1}>優先度: 高</option>
                <option value={2}>優先度: 中</option>
                <option value={3}>優先度: 低</option>
              </select>
              <input
                type="datetime-local"
                value={
                  formState.deadline
                    ? dayjs(formState.deadline).format("YYYY-MM-DDTHH:mm")
                    : ""
                }
                className="mt-2 w-full rounded-md border p-2"
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    deadline: e.target.value ? new Date(e.target.value) : null,
                  }))
                }
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={saveEdit}
                className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                保存
              </button>
              <button
                onClick={cancelEdit}
                className="w-full rounded-md bg-gray-500 px-4 py-2 text-white"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-4">
            <h2 className="text-xl font-bold">新しいタスクを追加</h2>
            <input
              type="text"
              value={formState.name}
              className="mt-2 w-full rounded-md border p-2"
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, name: e.target.value }))
              }
            />
            <div className="mt-4 flex items-center">
              <select
                value={formState.priority}
                className="w-full rounded-md border p-2"
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    priority: Number(e.target.value),
                  }))
                }
              >
                <option value={1}>優先度: 高</option>
                <option value={2}>優先度: 中</option>
                <option value={3}>優先度: 低</option>
              </select>
              <input
                type="datetime-local"
                value={
                  formState.deadline
                    ? dayjs(formState.deadline).format("YYYY-MM-DDTHH:mm")
                    : ""
                }
                className="mt-2 w-full rounded-md border p-2"
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    deadline: e.target.value ? new Date(e.target.value) : null,
                  }))
                }
              />
            </div>
            <div className="mt-4">
              <button
                onClick={addNewTodo}
                className="w-full rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
              >
                タスクを追加
              </button>
            </div>
          </div>
        )}

        {/* 完了済みタスクの削除ボタン */}
        <div className="mt-4">
          <button
            onClick={removeCompletedTodos}
            className="w-full rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            完了済みタスクを削除
          </button>
        </div>
      </div>

      {/* トースト通知 */}
      <div className="fixed bottom-4 left-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`mb-2 rounded-md p-2 ${toast.type === "success" ? "bg-green-500" : toast.type === "error" ? "bg-red-500" : "bg-blue-500"} text-white`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default App;

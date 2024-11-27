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

type Toast = {
  id: string;
  message: string;
  type: "success" | "error" | "info";
};

const initialFormState = {
  name: "",
  priority: 3,
  deadline: null as Date | null,
};

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
  const [formState, setFormState] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const localStorageKey = "TodoApp";

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "info") => {
      const newToast = {
        id: uuid(),
        message,
        type,
      };
      setToasts((prev) => [...prev, newToast]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== newToast.id));
      }, 3000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

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
        setInitialized(true);
      }
    };
    loadTodos();
  }, [showToast]);

  useEffect(() => {
    if (initialized) {
      localStorage.setItem(localStorageKey, JSON.stringify(todos));
    }
  }, [todos, initialized]);

  const uncompletedCount = useMemo(
    () => todos.filter((todo: Todo) => !todo.isDone).length,
    [todos]
  );

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

  const updateIsDone = useCallback((id: string, value: boolean) => {
    setTodos((prev) =>
      prev.map((todo) => (todo.id === id ? { ...todo, isDone: value } : todo))
    );
  }, []);

  const remove = useCallback(
    (id: string) => {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
      showToast("タスクを削除しました", "info");
    },
    [showToast]
  );

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
    isDarkMode && "bg-gray-900"
  );

  return (
    <div className={containerClasses}>
      <div className="mx-4 mt-10 max-w-2xl md:mx-auto">
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
            className={`rounded-full p-2 ${
              isDarkMode
                ? "text-white hover:bg-gray-700"
                : "text-gray-900 hover:bg-gray-200"
            }`}
            aria-label={
              isDarkMode ? "ライトモードに切り替え" : "ダークモードに切り替え"
            }
          >
            <FontAwesomeIcon
              icon={isDarkMode ? faSun : faMoon}
              className="size-5"
            />
          </button>
        </div>

        <div className="mb-4">
          <WelcomeMessage
            name="寝屋川タヌキ"
            uncompletedCount={uncompletedCount}
          />
        </div>

        <TodoList
          todos={todos}
          updateIsDone={updateIsDone}
          remove={remove}
          isDarkMode={isDarkMode}
        />

        <div
          className={`mt-5 space-y-2 rounded-md border p-3 ${
            isDarkMode
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-white"
          }`}
        >
          <h2
            className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            新しいタスクの追加
          </h2>

          <div>
            <div className="flex items-center space-x-2">
              <label
                className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                htmlFor="name"
              >
                名前
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={formState.name}
                onChange={handleInputChange}
                className={twMerge(
                  "grow rounded-md border p-2",
                  isDarkMode
                    ? "bg-gray-700 text-white border-gray-600"
                    : "bg-white text-gray-900 border-gray-300",
                  formErrors.name && "border-red-500 outline-red-500"
                )}
                placeholder="2文字以上、32文字以内で入力してください"
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? "name-error" : undefined}
              />
            </div>
            {formErrors.name && (
              <div
                id="name-error"
                className="ml-10 flex items-center space-x-1 text-sm font-bold text-red-500"
              >
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  className="mr-0.5"
                />
                <div>{formErrors.name}</div>
              </div>
            )}
          </div>

          <div className="flex gap-5">
            <div
              className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              優先度
            </div>
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                className={`flex items-center space-x-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              >
                <input
                  id={`priority-${value}`}
                  name="priority"
                  type="radio"
                  value={value}
                  checked={formState.priority === value}
                  onChange={handleInputChange}
                  className={isDarkMode ? "text-blue-400" : "text-blue-600"}
                />
                <span>{value}</span>
              </label>
            ))}
          </div>

          <div className="flex items-center gap-x-2">
            <label
              htmlFor="deadline"
              className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              期限
            </label>
            <input
              type="datetime-local"
              id="deadline"
              name="deadline"
              value={
                formState.deadline
                  ? dayjs(formState.deadline).format("YYYY-MM-DDTHH:mm:ss")
                  : ""
              }
              onChange={handleDeadlineChange}
              className={`rounded-md border px-2 py-0.5 ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-gray-300 bg-white text-gray-900"
              }`}
            />
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={addNewTodo}
              disabled={!!formErrors.name}
              className={twMerge(
                "w-full rounded-md bg-indigo-500 px-3 py-1 font-bold text-white transition-colors hover:bg-indigo-600",
                (formErrors.name || !formState.name) &&
                  "cursor-not-allowed opacity-50"
              )}
            >
              追加
            </button>

            <button
              type="button"
              onClick={removeCompletedTodos}
              className="w-full rounded-md bg-red-500 px-3 py-1 font-bold text-white transition-colors hover:bg-red-600"
            >
              完了済みのタスクを削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;

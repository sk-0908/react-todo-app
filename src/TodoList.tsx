import React from "react";
import { Todo } from "./types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrash,
  faPen,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";

interface TodoListProps {
  todos: Todo[];
  updateIsDone: (id: string, value: boolean) => void;
  remove: (id: string) => void;
  startEditing: (id: string) => void;
  cancelEditing: (id: string) => void;
  updateTodo: (id: string, updatedTodo: Partial<Omit<Todo, "id">>) => void;
}

const TodoList: React.FC<TodoListProps> = ({
  todos,
  updateIsDone,
  remove,
  startEditing,
  cancelEditing,
  updateTodo,
}) => {
  return (
    <ul className="space-y-4">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className={`flex items-center justify-between rounded-lg border p-4 ${
            todo.isDone ? "bg-gray-200" : "bg-white"
          }`}
        >
          {!todo.isEditing ? (
            <>
              <div>
                <p
                  className={`text-lg font-bold ${todo.isDone ? "line-through" : ""}`}
                >
                  {todo.name}
                </p>
                <div className="mt-2 flex space-x-4 text-sm text-gray-600">
                  {/* 重要度の表示 */}
                  <span>
                    <strong>重要度:</strong>{" "}
                    {["高", "中", "低"][todo.priority - 1]}
                  </span>
                  {/* 期日の表示 */}
                  {todo.deadline && (
                    <span>
                      <strong>期日:</strong>{" "}
                      {dayjs(todo.deadline).format("YYYY-MM-DD")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => updateIsDone(todo.id, !todo.isDone)}
                  className={`rounded-md px-2 py-1 ${
                    todo.isDone
                      ? "bg-gray-500 text-white hover:bg-gray-600"
                      : "bg-green-500 text-white hover:bg-green-600"
                  }`}
                >
                  <FontAwesomeIcon icon={todo.isDone ? faTimes : faCheck} />
                </button>
                <button
                  onClick={() => startEditing(todo.id)}
                  className="rounded-md bg-blue-500 px-2 py-1 text-white hover:bg-blue-600"
                >
                  <FontAwesomeIcon icon={faPen} />
                </button>
                <button
                  onClick={() => remove(todo.id)}
                  className="rounded-md bg-red-500 px-2 py-1 text-white hover:bg-red-600"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            </>
          ) : (
            <div className="w-full">
              <input
                type="text"
                value={todo.name}
                onChange={(e) => updateTodo(todo.id, { name: e.target.value })}
                className="w-full rounded-md border border-gray-300 p-2"
              />
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => updateTodo(todo.id, { isEditing: false })}
                  className="w-1/2 rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
                >
                  保存
                </button>
                <button
                  onClick={() => cancelEditing(todo.id)}
                  className="w-1/2 rounded-md bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
};

export default TodoList;

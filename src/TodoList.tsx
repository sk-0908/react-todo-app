import React from "react";
import { Todo } from "./types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faFlag } from "@fortawesome/free-solid-svg-icons";
import dayjs from "dayjs";
type TodoListProps = {
  todos: Todo[];
  updateIsDone: (id: string, value: boolean) => void;
  remove: (id: string) => void;
};

const TodoList: React.FC<TodoListProps> = ({ todos, updateIsDone, remove }) => {
  return (
    <div className="space-y-4">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className="flex items-center justify-between rounded-lg border p-4 shadow-md"
        >
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={todo.isDone}
              onChange={(e) => updateIsDone(todo.id, e.target.checked)}
              className="mr-2"
            />
            <div className="flex flex-col">
              <span className="text-lg font-bold">{todo.name}</span>
              <div className="flex space-x-4">
                {todo.priority && (
                  <div className="flex items-center space-x-1">
                    <FontAwesomeIcon icon={faFlag} />
                    <span>{todo.priority}</span>
                  </div>
                )}
                {todo.deadline && (
                  <div className="flex items-center space-x-1">
                    <FontAwesomeIcon icon={faCalendar} />
                    <span>
                      {todo.deadline
                        ? dayjs(todo.deadline).format("YYYY-MM-DD HH:mm")
                        : "なし"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => remove(todo.id)}
            className="text-red-500 hover:text-red-700"
            aria-label="削除"
          >
            削除
          </button>
        </div>
      ))}
    </div>
  );
};

export default TodoList;

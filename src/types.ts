export interface Todo {
  id: string;
  name: string;
  isDone: boolean;
  priority: number;
  deadline: Date | null;
  isEditing?: boolean; // 編集モードのフラグを追加
}

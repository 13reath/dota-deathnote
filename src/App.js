import React from "react";

const initialPlayers = [
  {
    id: "123",
    nickname: "PlayerOne",
    avatar: "favicon.ico",
    comments: [
      { text: "Хороший игрок", hidden: false },
      { text: "Немного токсичный", hidden: false },
    ],
  },
  {
    id: "456",
    nickname: "NoobMaster",
    avatar: "https://via.placeholder.com/50",
    comments: [],
  },
  {
    id: "789",
    nickname: "MegaPro",
    avatar: "https://via.placeholder.com/50",
    comments: [{ text: "Саппорт от бога", hidden: false }],
  },
];

export default function App() {
  return <Navbar />;
}

function Navbar() {
  return (
    <nav className="flex justify-center gap-8 border-b-2">
      <select className="">
        <option value="1">Поиск Игрока по ID</option>
        <option value="2">Поиск Игрока по NICKNAME</option>
      </select>
      <input type="text" placeholder="Введи 1/2" />
      <select>
        <option value="all">По Новизне</option>
        <option value="active">По Количеству Лайков</option>
        <option value="archived">По Количеству Комментариев</option>
      </select>
      <button>Добавить Игрока</button>
    </nav>
  );
}

import React, { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, RotateCw, Shuffle, ListRestart, Check } from "lucide-react";
import "./App.css";

const WORDS = [
  { id: 1, kanji: "私", hira: "わたし", romaji: "watashi", ru: "я" },
  { id: 2, kanji: "人", hira: "ひと", romaji: "hito", ru: "человек" },
  { id: 3, kanji: "日本", hira: "にほん", romaji: "nihon", ru: "Япония" },
  { id: 4, kanji: "学校", hira: "がっこう", romaji: "gakkou", ru: "школа" },
  { id: 5, kanji: "先生", hira: "せんせい", romaji: "sensei", ru: "учитель" },
  { id: 6, kanji: "学生", hira: "がくせい", romaji: "gakusei", ru: "студент, ученик" },
  { id: 7, kanji: "水", hira: "みず", romaji: "mizu", ru: "вода" },
  { id: 8, kanji: "食べる", hira: "たべる", romaji: "taberu", ru: "есть, кушать" },
  { id: 9, kanji: "飲む", hira: "のむ", romaji: "nomu", ru: "пить" },
  { id: 10, kanji: "行く", hira: "いく", romaji: "iku", ru: "идти" },
  { id: 11, kanji: "来る", hira: "くる", romaji: "kuru", ru: "приходить" },
  { id: 12, kanji: "見る", hira: "みる", romaji: "miru", ru: "смотреть" },
  { id: 13, kanji: "大きい", hira: "おおきい", romaji: "ookii", ru: "большой" },
  { id: 14, kanji: "小さい", hira: "ちいさい", romaji: "chiisai", ru: "маленький" },
  { id: 15, kanji: "今日", hira: "きょう", romaji: "kнou", ru: "сегодня" },
  { id: 16, kanji: "明日", hira: "あした", romaji: "ashita", ru: "завтра" },
  { id: 17, kanji: "友達", hira: "ともだち", romaji: "tomodachi", ru: "друг" },
  { id: 18, kanji: "家", hira: "いえ", romaji: "ie", ru: "дом" },
  { id: 19, kanji: "時間", hira: "じかん", romaji: "jikan", ru: "время" },
  { id: 20, kanji: "好き", hira: "すき", romaji: "suki", ru: "нравиться" },
];

export default function App() {
  const [order, setOrder] = useState(WORDS.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(() => new Set());
  const [dragX, setDragX] = useState(0);
  const [anim, setAnim] = useState(null); // 'left' | 'right' | null
  const [showFurigana, setShowFurigana] = useState(false);
  const touchStart = useRef(null);
  const cardRef = useRef(null);

  const current = WORDS[order[pos]];
  const learnedCount = known.size;

  const goTo = useCallback(
    (nextPos, direction) => {
      if (nextPos < 0 || nextPos >= order.length) return;
      setAnim(direction);
      setTimeout(() => {
        setPos(nextPos);
        setFlipped(false);
        setAnim(null);
        setDragX(0);
      }, 160);
    },
    [order.length]
  );

  const next = useCallback(() => goTo(pos + 1, "left"), [pos, goTo]);
  const prev = useCallback(() => goTo(pos - 1, "right"), [pos, goTo]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  const toggleKnown = (e) => {
    e.stopPropagation();
    setKnown((prev) => {
      const s = new Set(prev);
      if (s.has(current.id)) s.delete(current.id);
      else s.add(current.id);
      return s;
    });
  };

  const shuffle = () => {
    const arr = order.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setOrder(arr);
    setPos(0);
    setFlipped(false);
  };

  const resetOrder = () => {
    setOrder(WORDS.map((_, i) => i));
    setPos(0);
    setFlipped(false);
  };

  const resetProgress = () => setKnown(new Set());

  // drag handlers: отдельно touch (мобильные) и mouse (десктоп) —
  // touch-события надёжнее для свайпа, т.к. не зависят от pointer capture
  const isDragging = useRef(false);
  const movedRef = useRef(0);

  const dragStart = (clientX) => {
    touchStart.current = clientX;
    isDragging.current = true;
    movedRef.current = 0;
  };
  const dragMove = (clientX) => {
    if (!isDragging.current || touchStart.current == null) return;
    const delta = clientX - touchStart.current;
    movedRef.current = delta;
    setDragX(delta);
  };
  const dragEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const delta = movedRef.current;
    if (delta < -70) next();
    else if (delta > 70) prev();
    else setDragX(0);
    touchStart.current = null;
  };

  const onMouseDown = (e) => dragStart(e.clientX);
  const onMouseMove = (e) => dragMove(e.clientX);
  const onMouseUp = () => dragEnd();

  const onTouchStart = (e) => dragStart(e.touches[0].clientX);
  const onTouchMove = (e) => dragMove(e.touches[0].clientX);
  const onTouchEnd = () => dragEnd();

  const onCardClick = () => {
    // клик засчитываем только если карточку почти не тащили — иначе это был свайп
    if (Math.abs(movedRef.current) < 8) setFlipped((f) => !f);
  };

  const isKnown = known.has(current.id);

  return (
    <div className="wrap">

      <div className="header">
        <div className="title-cluster">
          <div className="title-accent" aria-hidden="true" />
          <div className="title-block">
            <div className="title-row">
              <span className="title-jp">単語帳</span>
              <span className="level-seal">N5</span>
            </div>
            <div className="title-sub">Карточки для повторения</div>
          </div>
        </div>
        <div className="counter">
          <span className="counter-num">{learnedCount}</span>
          <span className="counter-den">/ {WORDS.length} знаю</span>
        </div>
      </div>

      <div className="settings-row">
        <span className="settings-label">Подсказка</span>
        <button
          className={`switch ${showFurigana ? "on" : ""}`}
          onClick={() => setShowFurigana((v) => !v)}
          role="switch"
          aria-checked={showFurigana}
          aria-label="Показывать фуригану над кандзи"
        >
          <span className="switch-knob" />
        </button>
      </div>

      <div className="stage">
        <div
          ref={cardRef}
          className={`card ${flipped ? "flipped" : ""} ${anim ? `anim-${anim}` : ""}`}
          onClick={onCardClick}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          style={{
            ...(!anim && dragX
              ? { transform: `translateX(${dragX}px) rotate(${dragX / 30}deg)`, transition: "none" }
              : {}),
          }}
        >
          <div className="face face-front">
            <div className="corner-frame" aria-hidden="true" />
            <span className="idx-tag">{String(pos + 1).padStart(2, "0")} / {String(WORDS.length).padStart(2, "0")}</span>
            <span className="hint-tag">Нажми, чтобы перевернуть</span>
            <div className="kanji-wrap">
              <div key={showFurigana ? "furigana-on" : "furigana-off"} className={`furigana ${showFurigana ? "" : "furigana-hidden"}`}>{current.hira}</div>
              <div className="kanji-big">{current.kanji}</div>
            </div>
          </div>

          <div className="face face-back">
            <div className="corner-frame" aria-hidden="true" />
            <span className="idx-tag">{String(pos + 1).padStart(2, "0")} / {String(WORDS.length).padStart(2, "0")}</span>
            <span className="hint-tag">Кандзи ← тут</span>
            <div className="back-content">
              <div className="back-hira">{current.hira}</div>
              <div className="back-romaji">{current.romaji}</div>
              <div className="back-divider" />
              <div className="back-ru">{current.ru}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="know-row">
        <button
          className={`know-btn ${isKnown ? "on" : ""}`}
          onClick={toggleKnown}
        >
          <Check size={18} />
          <span>{isKnown ? "Знаю это слово" : "Отметить «Знаю»"}</span>
        </button>
      </div>

      <div className="controls">
        <button className="nav-btn" onClick={prev} disabled={pos === 0} aria-label="Предыдущая">
          <ChevronLeft size={20} />
        </button>
        <button className="flip-btn" onClick={() => setFlipped((f) => !f)} aria-label="Перевернуть карточку">
          <RotateCw size={18} />
        </button>
        <button className="nav-btn" onClick={next} disabled={pos === order.length - 1} aria-label="Следующая">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="progress-row">
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${((pos + 1) / order.length) * 100}%` }}>
            <span className="progress-dot" />
          </div>
        </div>
        <div className="progress-labels">
          <span>Карточка {pos + 1}</span>
          <span>Всего {order.length}</span>
        </div>
      </div>

      <div className="toolbar">
        <button className="tool-link" onClick={shuffle}>
          <Shuffle /> Перемешать
        </button>
        <button className="tool-link" onClick={resetOrder}>
          <ListRestart /> По порядку
        </button>
        <button className="tool-link" onClick={resetProgress}>
          Сбросить прогресс
        </button>
      </div>
    </div>
  );
}
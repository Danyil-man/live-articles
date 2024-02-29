import React from "react";
import style from "./Header.module.scss";

const Header = () => {
  return (
    <header className={style.header}>
      <div className={style.leftSide}>Live Articles</div>
      <div className={style.rightSide}>Profile</div>
    </header>
  );
};

export default Header;

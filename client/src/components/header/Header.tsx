import React from "react";
import style from "./Header.module.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";

const Header = () => {
  return (
    <header className={style.header}>
      <div className={style.leftSide}>Live Articles</div>
      <div className={style.rightSide}>
        <FontAwesomeIcon icon={faUser} color="#fff" fontSize={18} />
      </div>
    </header>
  );
};

export default Header;

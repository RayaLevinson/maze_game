import React from "react";
import PropTypes from "prop-types";
import styles from "./Notification.module.css";

const Notification = ({ show, gameOver }) => {
  return (
    show && (
      <div className={styles.root}>
        {gameOver ? <p>GAME OVER</p> : null}
        PRESS ENTER TO START
      </div>
    )
  );
};

Notification.propTypes = {
  show: PropTypes.bool.isRequired,
  gameOver: PropTypes.bool.isRequired,
};

export default Notification;

import React, { useCallback, useEffect, useReducer } from "react";
import ReactPlayer from "react-player";
import useInterval from "@use-it/interval";
import Header from "components/header/Header";
import Notification from "components/notification/Notification";
import MazeGenerator from "components/maze/MazeGenerator";
import Board from "components/board/Board";
import mazeAudio from "assets/audio/maze.mp3";
import levelEndAudio from "assets/audio/level_end.mp3";
import styles from "./Game.module.css";
import { 
  START_GAME, GO_UP, GO_DOWN, GO_LEFT, GO_RIGHT, DECREMENT_TIME, GOAL_REACHED,
  ADD_LOLLIPOP, LOLLIPOP_HIT, CLEAR_LOLLIPOP_PRIZE_TEXT, 
  ADD_ICE_CREAM, ICE_CREAM_HIT, CLEAR_ICE_CREAM_PRIZE_TEXT, 
  PREPARE_TO_NEXT_LEVEL
} from './types';

const ROUND_TIME = 60;
const ROWS = 17;
const COLS = 33;
const TIME_TO_APPEAR_LOLLIPOP = 30000;
const LOLLIPOP_BONUS_TIME = 15;
const LOLLIPOP_BONUS_POINTS = 5000;
const ICE_CREAM_BONUS_TIME = 30;
const ICE_CREAM_BONUS_POINTS = 10000;

const isWall = (maze, currentCell, side) => {
  return maze.cells[currentCell[1] * COLS + currentCell[0]][side];
};

const getRandomCell = (currentCell, lollipopCell, iceCreamCell) => {
  let randomCell;
  do {
    randomCell = [
      Math.floor(Math.random() * COLS),
      Math.floor(Math.random() * ROWS),
    ];
  } while (
    // Exclude current cell
    (randomCell[0] === currentCell[0] && randomCell[1] === currentCell[1]) || 
    // Exclude goal cell
    (randomCell[0] === COLS - 1 && randomCell[1] === ROWS - 1) || 
    // Exclude option where two prizes are on the same cell
    (lollipopCell && randomCell[0] === lollipopCell[0] && randomCell[1] === lollipopCell[1]) || 
    (iceCreamCell && randomCell[0] === iceCreamCell[0] && randomCell[1] === iceCreamCell[1])
  );
  return randomCell;
};

const hittingPrize = (cell, prizeCell) => {
  return cell[0] === prizeCell[0] && cell[1] === prizeCell[1];
};

const reducer = (state, action) => {
  const { maze, points, currentCell, time, round, isGoalReached, hiScore, lollipopCell, iceCreamCell, nextRoundTime } = state;
  const { type, payload } = action;

  switch (type) {
    case START_GAME:
      return {
        ...state,
        maze: payload.maze,
        currentCell: payload.maze.startCell,
        time: ROUND_TIME,
        points: 0,
        hiScore: 0,
        round: 1,
        isGoalReached: false,
        lollipopCell: undefined,
        iceCreamCell: undefined,
        lollipopWasHit: false,
        iceCreamWasHit: false,
        showLollipopPrizeText: undefined,
        showIceCreamPrizeText: undefined,
        playMazeAudio: true,
      };    
    case GO_UP: 
      if (currentCell[1] === 0 || isWall(maze, currentCell, 0)) {
        return state;
      }   
      return {
        ...state,
        points: points + 10,
        currentCell: [currentCell[0], currentCell[1] - 1],
      };    
    case GO_LEFT:
      if (currentCell[0] === 0 || isWall(maze, currentCell, 3)) {
        return state;
      }
      return {
        ...state,
        points: points + 10,
        currentCell: [currentCell[0] - 1, currentCell[1]],
      };
    case GO_DOWN:
      if (currentCell[1] === ROWS - 1 || isWall(maze, currentCell, 2)) {
        return state;
      }
      return {
        ...state,
        points: points + 10,
        currentCell: [currentCell[0], currentCell[1] + 1],
      };
    case GO_RIGHT:
      if (currentCell[0] === COLS - 1 || isWall(maze, currentCell, 1)) {
        return state;
      }
      return {
        ...state,
        points: points + 10,
        currentCell: [currentCell[0] + 1, currentCell[1]],
      };
    case DECREMENT_TIME:
      return {
        ...state,
        time: state.time - 1,
      };
    case ADD_LOLLIPOP:
      return {
        ...state,
        lollipopCell: isGoalReached ? undefined : getRandomCell(currentCell, null, iceCreamCell),
      };
    case LOLLIPOP_HIT:
      return {
        ...state,
        points: points + LOLLIPOP_BONUS_POINTS,
        lollipopWasHit: true,
        time: time + LOLLIPOP_BONUS_TIME,
        showLollipopPrizeText: true,
      };
    case CLEAR_LOLLIPOP_PRIZE_TEXT:
      return {
        ...state,
        showLollipopPrizeText: false,
      };
    case ADD_ICE_CREAM:
      return {
        ...state, 
        iceCreamCell: isGoalReached ? undefined : getRandomCell(currentCell, lollipopCell, null),
      };
    case ICE_CREAM_HIT:
      return {
        ...state,
        points: points + ICE_CREAM_BONUS_POINTS,
        iceCreamWasHit: true,
        time: time + ICE_CREAM_BONUS_TIME,
        showIceCreamPrizeText: true,
      };
    case CLEAR_ICE_CREAM_PRIZE_TEXT:
      return {
        ...state,
        showIceCreamPrizeText: false,
      };
    case GOAL_REACHED: 
      return {
        ...state,
        isGoalReached: true,
        nextRoundTime: time > ROUND_TIME ? time : undefined,
        hiScore: points + hiScore + round * time * 100,
      };      
    case PREPARE_TO_NEXT_LEVEL: 
      return {
        ...state,
        maze: payload.maze,
        currentCell: payload.maze.startCell,
        time: nextRoundTime ? nextRoundTime : ROUND_TIME,
        points: 0,
        round: round + 1,
        isGoalReached: false,
        lollipopCell: undefined,
        iceCreamCell: undefined,
        lollipopWasHit: false,
        iceCreamWasHit: false,
        showLollipopPrizeText: undefined,
        showIceCreamPrizeText: undefined,
      };    
    default:
      return state;
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, {
    points: 0,
    round: 1,
    hiScore: 0,
    time: undefined,
    maze: undefined,
    currentCell: undefined,
    isGoalReached: false,
    lollipopCell: undefined,
    iceCreamCell: undefined,
    lollipopWasHit: false,
    iceCreamAlreadyHit: false,
    showLollipopPrizeText: undefined,
    showIceCreamPrizeText: undefined,
    readyToNextLevel: false,
    nextRoundTime: undefined,
  });

  const { maze, points, currentCell, time, round, isGoalReached, hiScore, lollipopCell, iceCreamCell, 
          lollipopWasHit, iceCreamWasHit, showLollipopPrizeText, showIceCreamPrizeText } = state;

  const handleOnEnterKeyPressed = useCallback(() => {
    if (!time) {
      dispatch({
        type: START_GAME,
        payload: { maze: new MazeGenerator(ROWS, COLS).generate() },
      });
    }
  }, [time]);

  const handleOnArrowDownPressed = useCallback(() => {
    if (time && !isGoalReached) {
      dispatch({
        type: GO_DOWN,
      });
    }
  }, [time, isGoalReached]);

  const handleOnArrowLeftPressed = useCallback(() => {
    if (time && !isGoalReached) {
      dispatch({
        type: GO_LEFT,
      });
    }
  }, [time, isGoalReached]);

  const handleOnArrowUpPressed = useCallback(() => {
    if (time && !isGoalReached) {
      dispatch({
        type: GO_UP,
      });
    }
  }, [time, isGoalReached]);

  const handleOnArrowRightPressed = useCallback(() => {
    if (time && !isGoalReached) {
      dispatch({
        type: GO_RIGHT,
      });
    }
  }, [time, isGoalReached]);

  useInterval(
    () => {
      dispatch({
        type: PREPARE_TO_NEXT_LEVEL,
        payload: { maze: new MazeGenerator(ROWS, COLS).generate() },
      });
    },
    isGoalReached ? 2800 : null // time to play 'level end tune' music
  );

  useEffect(() => {
    const onKeyDown = (e) => {
      switch (e.keyCode) {
        case 13:
          handleOnEnterKeyPressed();
          break;
        case 37: 
          handleOnArrowLeftPressed();
          break;        
        case 38: 
          handleOnArrowUpPressed();
          break;
        case 39: 
          handleOnArrowRightPressed();
          break;
        case 40: 
          handleOnArrowDownPressed();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [ handleOnEnterKeyPressed, handleOnArrowLeftPressed, handleOnArrowUpPressed, 
       handleOnArrowRightPressed, handleOnArrowDownPressed ]);

  useInterval(
    () => {
      dispatch({ type: DECREMENT_TIME });
    },
    time ? 1000 : null
  );

  useInterval(
    () => {
      dispatch({ type: ADD_LOLLIPOP });
    },
    time && !lollipopCell ? TIME_TO_APPEAR_LOLLIPOP : null
  );

  const timeToAppearIceCream = ROUND_TIME * 1000 - 15000;

  useInterval(
    () => {
      dispatch({ type: ADD_ICE_CREAM });
    },
    time && !iceCreamCell ? timeToAppearIceCream : null
  );

  useEffect(() => {
    if (
      maze && currentCell[0] === maze.endCell[1] && currentCell[1] === maze.endCell[0]
    ) {
      dispatch({ type: GOAL_REACHED });
    }

    if (
      lollipopCell && !lollipopWasHit && hittingPrize(currentCell, lollipopCell)
    ) {
      dispatch({ type: LOLLIPOP_HIT });
    }

    if (
      iceCreamCell && !iceCreamWasHit && hittingPrize(currentCell, iceCreamCell)) {
      dispatch({ type: ICE_CREAM_HIT });
    }
  }, [ maze, currentCell, lollipopCell, lollipopWasHit, iceCreamCell, iceCreamWasHit ]);

  useInterval(
    () => {
      dispatch({ type: CLEAR_LOLLIPOP_PRIZE_TEXT });
    },
    showLollipopPrizeText ? 3000 : null
  );

  useInterval(
    () => {
      dispatch({ type: CLEAR_ICE_CREAM_PRIZE_TEXT });
    },
    showIceCreamPrizeText ? 3000 : null
  );

  return (
    <div className={styles.root}>
      <Header hiScore={hiScore} points={points} time={time} round={round} />
      <Board
        maze={maze}
        currentCell={currentCell}
        lollipopCell={lollipopCell}
        iceCreamCell={iceCreamCell}
        lollipopWasHit={lollipopWasHit}
        iceCreamWasHit={iceCreamWasHit}
        showLollipopPrizeText={showLollipopPrizeText}
        showIceCreamPrizeText={showIceCreamPrizeText}
      />
      <Notification show={!time} gameOver={time === 0} />

      {isGoalReached ? (
        <ReactPlayer url={levelEndAudio} playing={true} />
      ) : (
        time > 0 && <ReactPlayer url={mazeAudio} loop playing={true} />
      )}
    </div>
  );
}

export default App;

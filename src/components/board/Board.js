import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import logoSvg from "assets/logo.svg";
import lollipopSvg from "assets/images/lollipop.svg";
import iceCreamSvg from "assets/images/ice_cream.svg";
import styles from "./Board.module.css";

const LOLlIPOP_BONUS_TXT = '+5000';
const ICE_CREAM_BONUS_TXT = '+10000';
const GOAL_TXT = 'Goal';

const drawLine = (ctx, x1, y1, width, height) => {
  ctx.strokeStyle = "white";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + width, y1 + height);
  ctx.stroke();
};
function Board(props) {
  const { maze, currentCell, lollipopCell, iceCreamCell, lollipopWasHit, showLollipopPrizeText,
          iceCreamWasHit, showIceCreamPrizeText } = props;

  const canvas = useRef(null);
  const container = useRef(null);
  const [ctx, setCtx] = useState(undefined);

  useEffect(() => {
    const fitToContainer = () => {
      const { offsetWidth, offsetHeight } = container.current;
      canvas.current.width = offsetWidth;
      canvas.current.height = offsetHeight;
      canvas.current.style.width = offsetWidth + "px";
      canvas.current.style.height = offsetHeight + "px";
    };

    setCtx(canvas.current.getContext("2d"));
    setTimeout(fitToContainer, 0);
  }, []);

  useEffect(() => {
    let intervalId;

    const draw = () => {
      if (!maze) {
        return;
      }

      ctx.fillStyle = "blue";
      ctx.fillRect(0, 0, canvas.current.width, canvas.current.height);

      const blockWidth = Math.floor(canvas.current.width / maze.cols);
      const blockHeight = Math.floor(canvas.current.height / maze.rows);
      const xOffset = Math.floor((canvas.current.width - maze.cols * blockWidth) / 2);

      for (let y = 0; y < maze.rows; y++) {
        for (let x = 0; x < maze.cols; x++) {
          const cell = maze.cells[x + y * maze.cols];
          if (y === 0 && cell[0]) {
            drawLine(ctx, blockWidth * x + xOffset, blockHeight * y, blockWidth, 0);
          }
          if (cell[1]) {
            drawLine(ctx, blockWidth * (x + 1) + xOffset, blockHeight * y, 0, blockHeight);
          }
          if (cell[2]) {
            drawLine(ctx, blockWidth * x + xOffset, blockHeight * (y + 1), blockWidth, 0);
          }
          if (x === 0 && cell[3]) {
            drawLine(ctx, blockWidth * x + xOffset, blockHeight * y, 0, blockHeight);
          }
        }
      }

      const logoSize = 0.75 * Math.min(blockWidth, blockHeight);
      const logoImage = new Image(logoSize, logoSize);

      logoImage.onload = () => {
        ctx.drawImage(logoImage, currentCell[0] * blockWidth + xOffset + (blockWidth - logoSize) / 2,
          currentCell[1] * blockHeight + (blockHeight - logoSize) / 2, logoSize, logoSize);
      };

      logoImage.src = logoSvg;
      const lollipopSize = 0.75 * Math.min(blockWidth, blockHeight);
      const lollipopImage = new Image(lollipopSize, lollipopSize);

      // Add lollipop image
      if (lollipopCell && !lollipopWasHit) {
        lollipopImage.onload = () => {
          ctx.drawImage(lollipopImage, lollipopCell[0] * blockWidth + xOffset + (blockWidth - lollipopSize) / 2,
            lollipopCell[1] * blockHeight + (blockHeight - lollipopSize) / 2,
            lollipopSize, lollipopSize);
        };
        lollipopImage.src = lollipopSvg;
      } else if (lollipopCell && lollipopWasHit && showLollipopPrizeText) {
        // Clear lollipop image and add bonus text
        ctx.rect(lollipopCell[0] * blockWidth + xOffset + (blockWidth - lollipopSize) / 2,
                      lollipopCell[1] * blockHeight + (blockHeight - lollipopSize) / 2,
                      lollipopSize, lollipopSize
        );
        ctx.fillStyle = "blue";
        ctx.fill();

        // Show text of the bonus
        const prizeTextSize = Math.min(blockWidth, blockHeight);
        ctx.fillStyle = "white";
        ctx.font = '20px "Joystix"';
        ctx.textBaseline = "top";

        ctx.fillText(LOLlIPOP_BONUS_TXT, 
          lollipopCell[0] * blockWidth + xOffset + (blockWidth - prizeTextSize) / 2,
          lollipopCell[1] * blockHeight + (blockHeight - prizeTextSize) / 2, prizeTextSize
        );
      }

      // Add iceCream image
      if (iceCreamCell && !iceCreamWasHit) {
        const iceCreamSize = 0.75 * Math.min(blockWidth, blockHeight);
        const iceCreamImage = new Image(iceCreamSize, iceCreamSize);

        iceCreamImage.onload = () => {
          ctx.drawImage(iceCreamImage, 
            iceCreamCell[0] * blockWidth + xOffset + (blockWidth - iceCreamSize) / 2,
            iceCreamCell[1] * blockHeight + (blockHeight - iceCreamSize) / 2,
            iceCreamSize, iceCreamSize);
        };

        iceCreamImage.src = iceCreamSvg;
      } else if (iceCreamCell && showIceCreamPrizeText) {
        // Clear iceCream image and add bonus text
        ctx.rect(maze.endCell[1] * blockWidth + xOffset + blockWidth / 2 + 1,
                 maze.endCell[0] * blockHeight + blockHeight / 2,
                 blockHeight, (blockWidth - 1) / 2);
        ctx.fillStyle = "blue";
        ctx.fill();

        // Show text of the bonus
        const prizeTextSize = Math.min(blockWidth, blockHeight);
        ctx.fillStyle = "white";

        ctx.fillText(ICE_CREAM_BONUS_TXT, iceCreamCell[0] * blockWidth + xOffset + (blockWidth - prizeTextSize) / 2,
                     iceCreamCell[1] * blockHeight + (blockHeight - prizeTextSize) / 2, prizeTextSize
        );
      }

      const textSize = Math.min(blockWidth, blockHeight);
      ctx.fillStyle = "red";
      ctx.font = '20px "Joystix"';
      ctx.textBaseline = "top";

      let count = 0;

      // Blink "GOAL" text
      intervalId = setInterval(() => {
        if (count % 2 === 0) {
          // Show text
          ctx.fillStyle = "red";
          ctx.fillText(GOAL_TXT, maze.endCell[1] * blockWidth + xOffset + (blockWidth - textSize) / 2,
                       maze.endCell[0] * blockHeight + (blockHeight - textSize) / 2, textSize
          );
        } else {
          // Clean text area as part of blinking process
          ctx.rect(maze.endCell[1] * blockWidth + xOffset + (blockWidth - textSize) / 2 + 1,
                   maze.endCell[0] * blockHeight + (blockHeight - textSize) / 2,
                   textSize - 2, textSize - 1
          );
          ctx.fillStyle = "blue";
          ctx.fill();
        }
        count++;
      }, 1000);
    };

    draw();

    return () => {
      clearInterval(intervalId);
    };
  }, [ ctx, currentCell, maze, lollipopCell, iceCreamCell, lollipopWasHit, iceCreamWasHit, 
      showLollipopPrizeText, showIceCreamPrizeText ]);

  return (
    <div className={styles.root} ref={container}>
      <canvas ref={canvas} />
    </div>
  );
}

Board.propTypes = {
  maze: PropTypes.shape({
    cols: PropTypes.number.isRequired,
    rows: PropTypes.number.isRequired,
    cells: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.bool)).isRequired,
    currentCell: PropTypes.arrayOf(PropTypes.number),
    lollipopCell: PropTypes.arrayOf(PropTypes.number),
    iceCreamCell: PropTypes.arrayOf(PropTypes.number),
    lollipopWasHit: PropTypes.bool,
    showLollipopPrizeText: PropTypes.bool,
    iceCreamWasHit: PropTypes.bool,
    showIceCreamPrizeText: PropTypes.bool,
  }),
};

export default Board;

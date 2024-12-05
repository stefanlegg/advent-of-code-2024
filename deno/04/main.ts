import * as path from "jsr:@std/path";

const MAIN_MODULE_DIR = path.dirname(path.fromFileUrl(Deno.mainModule));

enum Directions {
    UP = "up",
    DOWN = "down",
    RIGHT = "right",
    LEFT = "left",
    DIAG_UP_LEFT = "diag-up-left",
    DIAG_UP_RIGHT = "diag-up-right",
    DIAG_DOWN_LEFT = "diag-down-left",
    DIAG_DOWN_RIGHT = "diag-down-right",
}

type Delta = -1 | 1 | 0;
type DirectionsToDeltas = {
    [key in Directions]?: { x: Delta; y: Delta };
};

const DIRECTION_MAP: DirectionsToDeltas = {
    [Directions.UP]: { x: 0, y: -1 },
    [Directions.DOWN]: { x: 0, y: 1 },
    [Directions.RIGHT]: { x: 1, y: 0 },
    [Directions.LEFT]: { x: -1, y: 0 },
    [Directions.DIAG_UP_LEFT]: { x: -1, y: -1 },
    [Directions.DIAG_UP_RIGHT]: { x: 1, y: -1 },
    [Directions.DIAG_DOWN_LEFT]: { x: -1, y: 1 },
    [Directions.DIAG_DOWN_RIGHT]: { x: 1, y: 1 },
};

function stringToCrossword(input: string): string[][] {
    return input.split("\n").map((line) => line.split(""));
}

function checkWordAlongDirection({
    crossword,
    direction,
    targetWord,
    x,
    y,
}: {
    crossword: string[][];
    direction: { x: Delta; y: Delta };
    targetWord: string;
    x: number;
    y: number;
}): boolean {
    const validY = y >= 0 && y < crossword.length;
    const validX = validY && x >= 0 && x < crossword[y].length;

    // Out of bounds or no match...
    if (!validX || !validY || crossword[y][x] !== targetWord[0]) {
        return false;
    }

    // Check if we hit the last letter
    if (targetWord.length === 1) {
        return true;
    }

    // Continue checking in the current direction
    const { x: dx, y: dy } = direction;
    return checkWordAlongDirection({
        crossword,
        direction,
        targetWord: targetWord.slice(1),
        x: x + dx,
        y: y + dy,
    });
}

function getWordCountInCrossword(
    crossword: string[][],
    targetWord: string,
): number {
    let foundWordCount = 0;

    crossword.forEach((row, rowIndex) => {
        row.forEach((_, columnIndex) => {
            Object.values(DIRECTION_MAP).forEach(({ x: dx, y: dy }) => {
                if (
                    checkWordAlongDirection({
                        crossword,
                        direction: { x: dx, y: dy },
                        targetWord,
                        x: columnIndex,
                        y: rowIndex,
                    })
                ) {
                    foundWordCount++;
                }
            });
        });
    });

    return foundWordCount;
}

function getCountOfCrossedMasInCrossword(crossword: string[][]) {
    let foundCrossCount = 0;

    crossword.forEach((row, rowIndex) => {
        row.forEach((_, columnIndex) => {
            // We can skip the edges since our first check is for the middle letter
            if (
                rowIndex === 0 || columnIndex === 0 ||
                rowIndex === crossword.length - 1 ||
                columnIndex === row.length - 1
            ) {
                return;
            }

            const centerIsA = crossword[rowIndex][columnIndex] === "A";
            const leftDiagonalIsMAS =
                (crossword[rowIndex - 1][columnIndex - 1] === "M" &&
                    crossword[rowIndex + 1][columnIndex + 1] === "S") ||
                crossword[rowIndex - 1][columnIndex - 1] === "S" &&
                    crossword[rowIndex + 1][columnIndex + 1] === "M";
            const rightDiagonalIsMAS =
                (crossword[rowIndex - 1][columnIndex + 1] === "M" &&
                    crossword[rowIndex + 1][columnIndex - 1] === "S") ||
                crossword[rowIndex - 1][columnIndex + 1] === "S" &&
                    crossword[rowIndex + 1][columnIndex - 1] === "M";

            if (centerIsA && leftDiagonalIsMAS && rightDiagonalIsMAS) {
                foundCrossCount++;
            }
        });
    });

    return foundCrossCount;
}

async function main() {
    if (
        Deno.args.length <= 0
    ) {
        console.log("Please provide the relative path to your input text");
        return;
    }

    try {
        const inputFilePathFromArgs = Deno.args[0];
        const inputPath = path.join(MAIN_MODULE_DIR, inputFilePathFromArgs);

        const inputData = await Deno.readTextFile(
            inputPath,
        );

        const crossword = stringToCrossword(inputData);

        // Part 1
        const xmasCount = getWordCountInCrossword(crossword, "XMAS");
        console.log(`XMAS Count: ${xmasCount}`);

        // Part 2
        const crossMasCount = getCountOfCrossedMasInCrossword(crossword);
        console.log(`Crossed 'MAS' Count: ${crossMasCount}`);
    } catch (err) {
        console.log("Something went wrong...");
        console.log(err);
    }
}

main();

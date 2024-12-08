import * as path from "jsr:@std/path";

const MAIN_MODULE_DIR = path.dirname(path.fromFileUrl(Deno.mainModule));

const OBSTRUCTION = "#";

enum GuardDirection {
    Up = "^",
    Right = ">",
    Left = "<",
    Down = "v",
}

type Grid = string[][];
type GuardPosition = { row: number; column: number } | undefined;

const DIRECTION_MAP = {
    [GuardDirection.Up]: {
        deltaRow: -1,
        deltaColumn: 0,
        nextDirection: GuardDirection.Right,
    },
    [GuardDirection.Right]: {
        deltaRow: 0,
        deltaColumn: 1,
        nextDirection: GuardDirection.Down,
    },
    [GuardDirection.Down]: {
        deltaRow: 1,
        deltaColumn: 0,
        nextDirection: GuardDirection.Left,
    },
    [GuardDirection.Left]: {
        deltaRow: 0,
        deltaColumn: -1,
        nextDirection: GuardDirection.Up,
    },
};

function parseGrid(input: string) {
    return input.split("\n").map((line) => line.split(""));
}

function evaluateGrid(grid: Grid) {
    const guardDirection: GuardDirection = GuardDirection.Up;
    let guardPosition: GuardPosition;
    let gridsWithLoopsCount = 0;

    // Find the initial guard position
    for (const [rowIndex, row] of grid.entries()) {
        for (const [columnIndex, column] of row.entries()) {
            if (column === guardDirection) {
                guardPosition = { row: rowIndex, column: columnIndex };
            }
            // } else if (column !== OBSTRUCTION) {
            //     // Create an alternate version of the grid with an obstacle at this position
            //     // See if it'd cause a loop
            //     const newGrid = structuredClone(grid);
            //     newGrid[rowIndex][columnIndex] = OBSTRUCTION;

            //     const { hitLoop } = traverseGrid({
            //         grid: newGrid,
            //         initialGuardPosition: guardPosition,
            //     });

            //     if (hitLoop) {
            //         console.log(`loop position: [${rowIndex}][${columnIndex}]`);
            //         gridsWithLoopsCount += 1;
            //     }
            // }
        }
    }

    // Definitely not optimal, but whatever
    for (const [rowIndex, row] of grid.entries()) {
        for (const [columnIndex, column] of row.entries()) {
            if (column !== guardDirection && column !== OBSTRUCTION) {
                // Create an alternate version of the grid with an obstacle at this position
                // See if it'd cause a loop
                const newGrid = structuredClone(grid);
                newGrid[rowIndex][columnIndex] = OBSTRUCTION;

                const { hitLoop } = traverseGrid({
                    grid: newGrid,
                    initialGuardPosition: guardPosition,
                });

                if (hitLoop) {
                    gridsWithLoopsCount += 1;
                }
            }
        }
    }

    // Traverse our normal grid
    const { visitedCoordinates } = traverseGrid({
        grid,
        initialGuardPosition: guardPosition,
    });
    const visitedCoordinateCount = visitedCoordinates.size;

    return {
        visitedCoordinateCount,
        countOfPossibleLoops: gridsWithLoopsCount,
    };
}

function traverseGrid(
    { grid, initialGuardPosition }: {
        grid: Grid;
        initialGuardPosition: GuardPosition;
    },
) {
    const visitedCoordinatesWhileDirection = new Set<string>();
    const visitedCoordinates = new Set<string>();

    let guardPosition: GuardPosition = initialGuardPosition;
    let guardDirection: GuardDirection = GuardDirection.Up;
    let hitLoop = false;

    while (isGuardOnGrid(guardPosition, grid) && !hitLoop) {
        const currentCoordKey = `${guardPosition.row},${guardPosition.column}`;
        const currentCoordWithDirectionKey =
            `${currentCoordKey},${guardDirection}`;

        // Add the current position to the tracked coords set
        visitedCoordinates.add(
            currentCoordKey,
        );

        // Check if we're now in a loop
        if (
            !visitedCoordinatesWhileDirection.has(currentCoordWithDirectionKey)
        ) {
            visitedCoordinatesWhileDirection.add(currentCoordWithDirectionKey);
        } else {
            hitLoop = true;
        }

        const { nextRow, nextColumn, nextDirection } =
            getNextPositionAndDirection({
                grid,
                guardPosition,
                guardDirection,
            });
        guardPosition = { row: nextRow, column: nextColumn };
        guardDirection = nextDirection;
    }

    return { visitedCoordinates, hitLoop };
}

function isGuardOnGrid(
    guardPosition: GuardPosition,
    grid: Grid,
): guardPosition is NonNullable<GuardPosition> {
    if (
        !guardPosition || guardPosition.row < 0 || guardPosition.column < 0 ||
        guardPosition.row > grid.length - 1 ||
        guardPosition.column > grid[0].length - 1
    ) {
        return false;
    }
    return true;
}

function getNextPositionAndDirection(
    { guardPosition, guardDirection, grid }: {
        grid: Grid;
        guardPosition: NonNullable<GuardPosition>;
        guardDirection: GuardDirection;
    },
) {
    let nextPositionBlocked = false;
    const { deltaRow, deltaColumn, nextDirection } =
        DIRECTION_MAP[guardDirection];
    const nextRow = guardPosition.row + deltaRow;
    const nextColumn = guardPosition.column + deltaColumn;

    if (grid[nextRow] && grid[nextRow][nextColumn]) {
        nextPositionBlocked = grid[nextRow][nextColumn] === OBSTRUCTION;
    }

    return {
        nextRow: nextPositionBlocked ? guardPosition.row : nextRow,
        nextColumn: nextPositionBlocked ? guardPosition.column : nextColumn,
        nextDirection: nextPositionBlocked ? nextDirection : guardDirection,
    };
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

        const grid = parseGrid(inputData);

        const { visitedCoordinateCount, countOfPossibleLoops } = evaluateGrid(
            grid,
        );
        console.log(`Visited ${visitedCoordinateCount} different coordinates`);
        console.log(
            `Number of positions where loops are posible: ${countOfPossibleLoops}`,
        );
    } catch (err) {
        console.log("Something went wrong...");
        console.log(err);
    }
}

main();

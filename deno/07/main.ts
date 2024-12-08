import * as path from "jsr:@std/path";

const MAIN_MODULE_DIR = path.dirname(path.fromFileUrl(Deno.mainModule));

type Operation = (a: number, b: number) => number;
type Operations = {
    [key: string]: Operation;
};

const PART_1_OPERATIONS: Operations = {
    add: (a, b) => a + b,
    mult: (a, b: number) => a * b,
};

const PART_2_OPERATIONS: Operations = {
    add: (a, b) => a + b,
    mult: (a, b) => a * b,
    concat: (a, b) => a * Math.pow(10, b.toString().length) + b,
};

interface Equation {
    result: number;
    inputs: number[];
}

function parseInputData(input: string): Equation[] {
    try {
        return input.split("\n").map((line) => {
            const [res, ...rest] = line.split(":");
            return {
                result: parseInt(res),
                inputs: rest[0].trim().split(" ").map((input) =>
                    parseInt(input)
                ),
            };
        });
    } catch {
        throw new Error("Could not parse invalid data");
    }
}

function evaluateEquationResultPossible(
    equation: Equation,
    operations: Operations,
): boolean {
    const { result, inputs } = equation;

    const checkSolvable = (
        inputs: number[],
        currentValue: number,
        index: number,
    ): boolean => {
        if (index === inputs.length) {
            return currentValue === result;
        }

        for (
            const key of Object.keys(
                operations,
            ) as (keyof typeof operations)[]
        ) {
            const nextValue = operations[key](
                currentValue,
                inputs[index],
            );

            // If we're over the result, no need to continue down that path
            if (nextValue > result) {
                continue;
            }

            if (checkSolvable(inputs, nextValue, index + 1)) {
                return true;
            }
        }

        return false;
    };

    return checkSolvable(inputs, inputs[0], 1);
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

        const equations = parseInputData(inputData);

        // Part 1
        const possiblyTrueEquations = equations.filter((equation) =>
            evaluateEquationResultPossible(equation, PART_1_OPERATIONS)
        );
        const calibrationResult = possiblyTrueEquations.reduce(
            (acc, equation) => acc + equation.result,
            0,
        );

        console.log(`Calibration result: ${calibrationResult}`);

        // Part 2
        const possiblyTrueEquationsWithConcat = equations.filter((equation) =>
            evaluateEquationResultPossible(equation, PART_2_OPERATIONS)
        );
        const calibrationResultWithConcat = possiblyTrueEquationsWithConcat
            .reduce(
                (acc, equation) => acc + equation.result,
                0,
            );

        console.log(`Calibration result: ${calibrationResultWithConcat}`);
    } catch (err) {
        console.log("Something went wrong...");
        console.log(err);
    }
}

main();

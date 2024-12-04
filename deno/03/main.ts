import * as path from "jsr:@std/path";

const MAIN_MODULE_DIR = path.dirname(path.fromFileUrl(Deno.mainModule));
const HANDLE_CONDITIONALS = true; // Quick toggle between part 1 and 2

function sanitizeInput(input: string) {
    const baseRegex = /mul\(-?\d+,-?\d+\)/g;
    const regexWithConditionals = /mul\(-?\d+,-?\d+\)|do\(\)|don\'t\(\)/g;
    return input.match(HANDLE_CONDITIONALS ? regexWithConditionals : baseRegex);
}

function parseInstructions(data: string[]): number[][] {
    const numbersRegex = /\d+/g;
    const { instructions } = data.reduce<
        { enabled: boolean; instructions: number[][] }
    >((arr, instruction) => {
        if (instruction === "do()") {
            return { enabled: true, instructions: arr.instructions };
        } else if (instruction === "don't()") {
            return { enabled: false, instructions: arr.instructions };
        } else if (arr.enabled) {
            const matches = instruction.match(numbersRegex);
            if (matches === null) {
                throw new Error(
                    "Failed to parse improperly sanitized data",
                );
            }
            return {
                enabled: arr.enabled,
                instructions: [
                    ...arr.instructions,
                    matches.map((input) => parseInt(input)),
                ],
            };
        }
        return arr;
    }, { enabled: true, instructions: [] });

    return instructions;
}

function multiplyValuesInOperation(data: number[][]) {
    return data.map((operation) => {
        return operation.reduce((arr, val) => {
            return arr * val;
        }, 1);
    });
}

function addValues(data: number[]) {
    return data.reduce((arr, val) => (arr + val), 0);
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

        // Strip out all the junk data
        const sanitizedInputData = sanitizeInput(inputData);
        if (sanitizedInputData === null) {
            throw new Error("Could not properly sanitize the provided input");
        }

        // Convert the input data into individual multiplication operations
        const parsedInstructionSteps = parseInstructions(sanitizedInputData);

        // Do all the math
        const multipliedData = multiplyValuesInOperation(
            parsedInstructionSteps,
        );
        const answer = addValues(multipliedData);
        console.log(`Answer: ${answer}`);
    } catch (err) {
        console.log("Something went wrong...");
        console.log(err);
    }
}

main();

import * as path from "jsr:@std/path";

const MAIN_MODULE_DIR = path.dirname(path.fromFileUrl(Deno.mainModule));

function parseInputData(inputData: string) {
    const lines = inputData.split("\n");
    const splitPosition = lines.indexOf("");

    const orderingRules = lines.slice(0, splitPosition).map((pair) =>
        pair.split("|").map((val) => parseInt(val))
    );

    const updatesToPrint = lines.slice(
        splitPosition + 1,
        lines.length,
    ).map((line) => line.split(",").map((val) => parseInt(val)));

    return {
        orderingRules,
        updatesToPrint,
    };
}

function filterUpdatesByOrderingRules({
    orderingRules,
    updatesToPrint,
}: {
    orderingRules: number[][];
    updatesToPrint: number[][];
}) {
    return updatesToPrint.reduce<
        { validUpdatesToPrint: number[][]; invalidUpdatesToPrint: number[][] }
    >(
        (acc, update) => {
            for (const [index, pageNumber] of update.entries()) {
                // Skip the first page since it's always valid (not ordered against anything)
                if (index !== 0) {
                    // Iterate backwards through the prior pages in the update
                    for (let i = index - 1; i >= 0; i--) {
                        // Check if there are any rules where the incoming page need to be before a prior page
                        for (const [first, second] of orderingRules) {
                            if (first === pageNumber && second === update[i]) {
                                // This one is invalid
                                return {
                                    validUpdatesToPrint:
                                        acc.validUpdatesToPrint,
                                    invalidUpdatesToPrint: [
                                        ...acc.invalidUpdatesToPrint,
                                        update,
                                    ],
                                };
                            }
                        }
                    }
                }
            }
            // This one is valid
            return {
                validUpdatesToPrint: [...acc.validUpdatesToPrint, update],
                invalidUpdatesToPrint: acc.invalidUpdatesToPrint,
            };
        },
        { validUpdatesToPrint: [], invalidUpdatesToPrint: [] },
    );
}

function fixUpdateOrdering({
    orderingRules,
    invalidUpdatesToPrint,
}: {
    orderingRules: number[][];
    invalidUpdatesToPrint: number[][];
}) {
    return invalidUpdatesToPrint.map((update) => {
        return reorderUpdate({ orderingRules, update });
    });
}

function reorderUpdate(
    { orderingRules, update }: { orderingRules: number[][]; update: number[] },
): number[] {
    const isValid = (update: number[]): boolean => {
        for (let i = 1; i < update.length; i++) {
            for (let j = 0; j < i; j++) {
                const pageA = update[j];
                const pageB = update[i];

                for (const [first, second] of orderingRules) {
                    // If a rule is violated, return false
                    if (first === pageA && second === pageB) {
                        return false;
                    }
                }
            }
        }
        return true;
    };

    // If the update is valid, return it as is
    if (isValid(update)) {
        return update;
    }

    // If not valid...
    for (let i = 1; i < update.length; i++) {
        for (let j = 0; j < i; j++) {
            const pageA = update[j];
            const pageB = update[i];

            // Check each ordering rule
            for (const [first, second] of orderingRules) {
                // If we hit a breaking rule
                if (first === pageA && second === pageB) {
                    // Swap the elements to fix the order
                    [update[i], update[j]] = [update[j], update[i]];

                    // Recursively call reorderUpdate again to fix the next violations
                    return reorderUpdate({ orderingRules, update });
                }
            }
        }
    }

    return update;
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

        // Parse data into valid and invalid chunks
        const { orderingRules, updatesToPrint } = parseInputData(inputData);
        const { validUpdatesToPrint, invalidUpdatesToPrint } =
            filterUpdatesByOrderingRules({
                orderingRules,
                updatesToPrint,
            });

        // Fix the invalid ones
        const correctedInvalidUpdatesToPrint = fixUpdateOrdering({
            orderingRules,
            invalidUpdatesToPrint,
        });

        // Get the middle numbers for each chunk of updates
        const middleNumbersForValidUpdates = validUpdatesToPrint.map((update) =>
            update[Math.floor(update.length / 2)]
        );
        const middleNumbersForInalidUpdates = correctedInvalidUpdatesToPrint
            .map((update) => update[Math.floor(update.length / 2)]);

        // Sum everything up
        const sumForValids = middleNumbersForValidUpdates.reduce(
            (acc, val) => acc + val,
            0,
        );
        const sumbForCorrectedInvalids = middleNumbersForInalidUpdates.reduce(
            (acc, val) => acc + val,
            0,
        );

        console.log(`Answer for valid entries: ${sumForValids}`);
        console.log(`Answer for invalid entries: ${sumbForCorrectedInvalids}`);
    } catch (err) {
        console.log("Something went wrong...");
        console.log(err);
    }
}

main();

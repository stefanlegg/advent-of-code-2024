import * as path from "jsr:@std/path";

const MAIN_MODULE_DIR = path.dirname(path.fromFileUrl(Deno.mainModule));

function getDistance(
    locationsList1: number[],
    locationsList2: number[],
): number {
    let sum = 0;
    for (const index in locationsList1) {
        sum += Math.abs(locationsList1[index] - locationsList2[index]);
    }
    return sum;
}

interface Occurrances {
    [key: number]: number;
}

function getSimilarityScore(
    locationsList1: number[],
    locationsList2: number[],
): number {
    const occurrances: Occurrances = {};

    locationsList2.forEach((value) => {
        if (value in occurrances) {
            occurrances[value] += 1;
        } else {
            occurrances[value] = 1;
        }
    });

    return locationsList1.reduce((acc, val) => {
        const score = val * (occurrances[val] ?? 0);
        return acc + score;
    }, 0);
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

        const data = await Deno.readTextFile(
            inputPath,
        );
        const lines = data.split("\n");

        const locationList1: number[] = [];
        const locationList2: number[] = [];

        lines.forEach((line) => {
            const entries = line.split("   ");
            locationList1.push(parseInt(entries[0]));
            locationList2.push(parseInt(entries[1]));
        });

        locationList1.sort();
        locationList2.sort();

        const distance = getDistance(locationList1, locationList2);
        console.log(`Total distance: ${distance}`);

        const similarity = getSimilarityScore(locationList1, locationList2);
        console.log(`Similarity score: ${similarity}`);
    } catch (err) {
        console.log("Something went wrong...");
        console.log(err);
    }
}

main();

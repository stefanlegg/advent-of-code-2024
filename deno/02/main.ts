import * as path from "jsr:@std/path";

const MAIN_MODULE_DIR = path.dirname(path.fromFileUrl(Deno.mainModule));

interface ReportSafetyCounts {
    safe: number;
    damperedSafe: number;
    unsafe: number;
}

enum ReportStatus {
    Safe,
    DamperedSafe,
    Unsafe,
}

function validateEntries(values: string[]): boolean {
    return !values.some((value, index) => {
        const hasPreviousValue = index !== 0;
        const hasNextValue = index < values.length - 1;

        if (hasPreviousValue && hasNextValue) {
            const currentValue = parseInt(value);
            const nextValue = parseInt(values[index + 1]);
            const previousValue = parseInt(values[index - 1]);

            const changeFromPrev = previousValue - currentValue;
            const changeToNext = currentValue - nextValue;

            const absChangeFromPrev = Math.abs(changeFromPrev);
            const absChangeToNext = Math.abs(changeToNext);

            if (
                Math.sign(changeFromPrev) !==
                    Math.sign(changeToNext) ||
                absChangeFromPrev > 3 ||
                absChangeFromPrev < 1 ||
                absChangeToNext > 3 ||
                absChangeToNext < 1
            ) {
                return true;
            }
        }

        return false;
    });
}

function getReportStatus(values: string[]): ReportStatus {
    const isSafe = validateEntries(values);

    if (isSafe) {
        return ReportStatus.Safe;
    }

    for (const [index, _] of values.entries()) {
        const filteredValues = values.filter((_, i) => index !== i);
        const isDamperedSafe = validateEntries(filteredValues);
        if (isDamperedSafe) {
            return ReportStatus.DamperedSafe;
        }
    }

    return ReportStatus.Unsafe;
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
        const reports = data.split("\n");

        const { safe, unsafe, damperedSafe } = reports.reduce<
            ReportSafetyCounts
        >(
            (acc, report) => {
                const values = report.split(" ");

                const reportStatus = getReportStatus(values);

                return {
                    safe: reportStatus === ReportStatus.Safe
                        ? acc.safe + 1
                        : acc.safe,
                    damperedSafe: reportStatus === ReportStatus.DamperedSafe
                        ? acc.damperedSafe + 1
                        : acc.damperedSafe,
                    unsafe: reportStatus === ReportStatus.Unsafe
                        ? acc.unsafe + 1
                        : acc.unsafe,
                };
            },
            {
                safe: 0,
                damperedSafe: 0,
                unsafe: 0,
            },
        );

        console.log(`Safe reports: ${safe}`);
        console.log(`Dampered safe reports: ${damperedSafe}`);
        console.log(`Total safe reports: ${safe + damperedSafe}`);
        console.log(`Unsafe reports: ${unsafe}`);
    } catch (err) {
        console.log("Something went wrong...");
        console.log(err);
    }
}

main();

export function formatCliReport(scorecard) {
    const lines = [];
    const gradeColor = scorecard.grade.startsWith('A')
        ? '\x1b[32m' // Green
        : scorecard.grade === 'B'
            ? '\x1b[36m' // Cyan
            : scorecard.grade === 'C'
                ? '\x1b[33m' // Yellow
                : '\x1b[31m'; // Red
    const reset = '\x1b[0m';
    const bold = '\x1b[1m';
    const dim = '\x1b[2m';
    const green = '\x1b[32m';
    const yellow = '\x1b[33m';
    const red = '\x1b[31m';
    lines.push('');
    lines.push(`${bold}==============================================================================${reset}`);
    lines.push(`${bold}  NYMREL MACHINE TRUST & DUAL-AUDIENCE AUDIT SCORECARD${reset}`);
    lines.push(`${bold}==============================================================================${reset}`);
    lines.push('');
    lines.push(`  ${bold}Entity:${reset}        ${scorecard.entityName}`);
    lines.push(`  ${bold}Overall Score:${reset} ${gradeColor}${scorecard.overallScore}/100 (Grade: ${scorecard.grade})${reset}`);
    lines.push(`  ${bold}Checks:${reset}        ${green}${scorecard.passedCount} Passed${reset} | ${yellow}${scorecard.warnCount} Warnings${reset} | ${red}${scorecard.failCount} Failed${reset}`);
    lines.push(`  ${bold}Timestamp:${reset}     ${scorecard.timestamp}`);
    lines.push('');
    lines.push(`${bold}------------------------------------------------------------------------------${reset}`);
    lines.push(`${bold}  CHECK RESULTS${reset}`);
    lines.push(`${bold}------------------------------------------------------------------------------${reset}`);
    for (const c of scorecard.checks) {
        let tag = `${green}[ PASS ]${reset}`;
        if (c.status === 'WARN')
            tag = `${yellow}[ WARN ]${reset}`;
        if (c.status === 'FAIL')
            tag = `${red}[ FAIL ]${reset}`;
        lines.push(`  ${tag} ${bold}${c.title}${reset} (${c.category})`);
        lines.push(`         ${dim}${c.message}${reset}`);
    }
    lines.push('');
    lines.push(`${bold}==============================================================================${reset}`);
    lines.push('');
    return lines.join('\n');
}
//# sourceMappingURL=cliReporter.js.map
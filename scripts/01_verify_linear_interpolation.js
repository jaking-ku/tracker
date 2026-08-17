// 01_verify_linear_interpolation.js
// 선형 보간 알고리즘 및 다중 월 스냅샷 연산 과학적 검증 스크립트

function getMonthDiff(m1, m2) {
    const [y1, mo1] = m1.split('-').map(Number);
    const [y2, mo2] = m2.split('-').map(Number);
    return (y2 - y1) * 12 + (mo2 - mo1);
}

function addMonths(mStr, n) {
    const [y, mo] = mStr.split('-').map(Number);
    const d = new Date(y, mo - 1 + n, 1);
    const ry = d.getFullYear();
    const rmo = String(d.getMonth() + 1).padStart(2, '0');
    return `${ry}-${rmo}`;
}

function computeMonthlyRecords(baseAmount, snapshots, person) {
    const list = snapshots.filter(s => s.person === person).sort((a, b) => a.month.localeCompare(b.month));
    const computed = [];

    for (let i = 0; i < list.length; i++) {
        const curr = list[i];
        if (i === 0) {
            const diff = curr.balance - baseAmount;
            computed.push({
                person: person,
                month: curr.month,
                amount: diff,
                balance: curr.balance,
                isInterpolated: false,
                gapMonths: 1,
                memo: '초기 기준 대비 첫 기록'
            });
        } else {
            const prev = list[i - 1];
            const gap = getMonthDiff(prev.month, curr.month);
            const totalDiff = curr.balance - prev.balance;

            if (gap <= 0) {
                computed.push({
                    person: person,
                    month: curr.month,
                    amount: totalDiff,
                    balance: curr.balance,
                    isInterpolated: false,
                    gapMonths: 1,
                    memo: '동일 월 수정'
                });
            } else if (gap === 1) {
                computed.push({
                    person: person,
                    month: curr.month,
                    amount: totalDiff,
                    balance: curr.balance,
                    isInterpolated: false,
                    gapMonths: 1,
                    memo: '1개월 정상 기록'
                });
            } else {
                const avgDiff = Math.round(totalDiff / gap);
                let accumulatedDiff = 0;

                for (let step = 1; step <= gap; step++) {
                    const targetMonth = addMonths(prev.month, step);
                    const isLastStep = (step === gap);
                    const stepAmount = isLastStep ? (totalDiff - accumulatedDiff) : avgDiff;
                    accumulatedDiff += stepAmount;

                    computed.push({
                        person: person,
                        month: targetMonth,
                        amount: stepAmount,
                        balance: prev.balance + accumulatedDiff,
                        isInterpolated: true,
                        gapMonths: gap,
                        memo: `${gap}개월 미입력 자동 분할 (${step}/${gap})`
                    });
                }
            }
        }
    }
    return computed;
}

// 시나리오 1: 5월 1500만원 -> 7월 2000만원 입력 (6월 누락 케이스)
console.log('=== 시나리오 1: 누락 보간 검증 (5월 1500만 -> 7월 2000만) ===');
const baseJawon = 10000000;
const testSnapshots = [
    { id: 1, person: '자원', month: '2026-05', balance: 15000000 },
    { id: 2, person: '자원', month: '2026-07', balance: 20000000 }
];

const results = computeMonthlyRecords(baseJawon, testSnapshots, '자원');
console.log(JSON.stringify(results, null, 2));

// 검증 조건
const mayRecord = results.find(r => r.month === '2026-05');
const juneRecord = results.find(r => r.month === '2026-06');
const julyRecord = results.find(r => r.month === '2026-07');

console.log('\n[검증 결과]');
console.log('5월 변동액 (초기 1000만 -> 1500만):', mayRecord.amount, '== 5000000 ?', mayRecord.amount === 5000000);
console.log('6월 보간 저축액 (2개월간 +500만 중 250만):', juneRecord.amount, '== 2500000 ?', juneRecord.amount === 2500000, '보간여부:', juneRecord.isInterpolated);
console.log('7월 저축액 (2개월간 +500만 중 250만):', julyRecord.amount, '== 2500000 ?', julyRecord.amount === 2500000, '보간여부:', julyRecord.isInterpolated);
console.log('7월 최종 잔액:', julyRecord.balance, '== 20000000 ?', julyRecord.balance === 20000000);

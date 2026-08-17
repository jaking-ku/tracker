# -*- coding: utf-8 -*-
"""
01_verify_linear_interpolation.py
선형 보간 알고리즘 및 미입력 기간 분할 연산 과학적 검증 스크립트
"""

def get_month_diff(m1: str, m2: str) -> int:
    y1, mo1 = map(int, m1.split('-'))
    y2, mo2 = map(int, m2.split('-'))
    return (y2 - y1) * 12 + (mo2 - mo1)

def add_months(m_str: str, n: int) -> str:
    y, mo = map(int, m_str.split('-'))
    total_months = y * 12 + (mo - 1) + n
    new_y = total_months // 12
    new_mo = (total_months % 12) + 1
    return f"{new_y:04d}-{new_mo:02d}"

def compute_monthly_records(base_amount: int, snapshots: list, person: str) -> list:
    person_list = [s for s in snapshots if s['person'] == person]
    person_list.sort(key=lambda s: s['month'])
    computed = []

    for i, curr in enumerate(person_list):
        if i == 0:
            diff = curr['balance'] - base_amount
            computed.append({
                'person': person,
                'month': curr['month'],
                'amount': diff,
                'balance': curr['balance'],
                'is_interpolated': False,
                'gap_months': 1,
                'memo': '초기 기준 대비 첫 기록'
            })
        else:
            prev = person_list[i - 1]
            gap = get_month_diff(prev['month'], curr['month'])
            total_diff = curr['balance'] - prev['balance']

            if gap <= 0:
                computed.append({
                    'person': person,
                    'month': curr['month'],
                    'amount': total_diff,
                    'balance': curr['balance'],
                    'is_interpolated': False,
                    'gap_months': 1,
                    'memo': '동일 월 수정'
                })
            elif gap == 1:
                computed.append({
                    'person': person,
                    'month': curr['month'],
                    'amount': total_diff,
                    'balance': curr['balance'],
                    'is_interpolated': False,
                    'gap_months': 1,
                    'memo': '1개월 정상 기록'
                })
            else:
                avg_diff = round(total_diff / gap)
                accumulated_diff = 0
                for step in range(1, gap + 1):
                    target_month = add_months(prev['month'], step)
                    is_last_step = (step == gap)
                    step_amount = (total_diff - accumulated_diff) if is_last_step else avg_diff
                    accumulated_diff += step_amount
                    computed.append({
                        'person': person,
                        'month': target_month,
                        'amount': step_amount,
                        'balance': prev['balance'] + accumulated_diff,
                        'is_interpolated': True,
                        'gap_months': gap,
                        'memo': f"{gap}개월 미입력 자동 분할 ({step}/{gap})"
                    })
    return computed

if __name__ == '__main__':
    base_jawon = 10000000
    test_snapshots = [
        {'id': 1, 'person': '자원', 'month': '2026-05', 'balance': 15000000},
        {'id': 2, 'person': '자원', 'month': '2026-07', 'balance': 20000000}
    ]

    results = compute_monthly_records(base_jawon, test_snapshots, '자원')
    print("연산 결과:")
    for r in results:
        print(f"[{r['month']}] {r['person']} | 변동액: {r['amount']:,}원 | 잔액: {r['balance']:,}원 | 보간여부: {r['is_interpolated']} | 메모: {r['memo']}")

    # 단정문(Assert) 검증
    may = next(r for r in results if r['month'] == '2026-05')
    june = next(r for r in results if r['month'] == '2026-06')
    july = next(r for r in results if r['month'] == '2026-07')

    assert may['amount'] == 5000000, "5월 변동액 불일치"
    assert june['amount'] == 2500000, "6월 보간 저축액 불일치"
    assert june['is_interpolated'] is True, "6월 보간 플래그 불일치"
    assert july['amount'] == 2500000, "7월 저축액 불일치"
    assert july['balance'] == 20000000, "7월 잔액 불일치"

    print("\n모든 수학적 검증 통과 완료!")

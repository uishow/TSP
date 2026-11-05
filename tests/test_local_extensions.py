import json

from overrides.local_extensions import (
    BUILTIN_BOARDS, FUYAO_BOARDS, builtin_rows, membership_rows,
    official_rows, publish_official_boards,
)


def test_membership_preserves_all_categories_without_unknown_code_inference():
    data = membership_rows(
        [{'type': 'concept', 'name': '人工智能', 'symbols': ['600031', '999999']},
         {'type': 'sw_1', 'category': '申万一级', 'name': '机械', 'symbols': ['600031']}],
        [{'symbol': '600031.SH', 'name': '三一重工'}],
    )
    assert data['concept'][0]['所属概念'] == '人工智能'
    assert len(data['concept']) == 1
    assert data['industry'][0]['所属行业'] == '申万一级/机械'
    assert data['industry'][0]['pit_verified'] is False


def test_builtin_board_rows_publish_primary_taxonomy_only():
    """TDX fallback must NOT leak into the THS field (it created a fake 'TDX' group)."""
    membership = {
        'concept': [
            {'symbol': '600031.SH', 'code': '600031', 'name': '三一重工',
             '所属概念': '工程机械;一带一路'},
        ],
        'tdx_concept': [
            {'symbol': '600031.SH', 'code': '600031', 'name': '三一重工',
             '通达信概念': '高端装备'},
            {'symbol': '000001.SZ', 'code': '000001', 'name': '平安银行',
             '通达信概念': '深成指'},
        ],
    }
    rows = builtin_rows(membership, 'ext_gn_ths')
    assert [r['symbol'] for r in rows] == ['600031.SH']
    by = {r['symbol']: r for r in rows}
    assert by['600031.SH']['所属概念'] == '一带一路;工程机械'
    assert 'TDX' not in by['600031.SH']['所属概念']
    assert by['600031.SH']['股票代码'] == '600031'
    assert by['600031.SH']['股票简称'] == '三一重工'
    assert set(by['600031.SH']) == {'symbol', 'code', '股票代码', '股票简称', '所属概念'}


def test_builtin_industry_rows_deduplicate_tags_and_skip_empty_memberships():
    membership = {
        'industry': [{'symbol': '600031.SH', 'code': '600031', 'name': '三一重工',
                      '所属行业': '申万一级/机械设备;申万一级/机械设备'}],
        'tdx_industry': [{'symbol': '600031.SH', 'code': '600031', 'name': '三一重工',
                          '通达信行业': '工程机械'},
                         {'symbol': '600000.SH', 'code': '600000', 'name': '浦发银行',
                          '通达信行业': ''}],
    }
    rows = builtin_rows(membership, 'ext_hy_ths')
    assert len(rows) == 1
    assert rows[0]['所属同花顺行业'] == '申万一级/机械设备'
    assert 'TDX' not in rows[0]['所属同花顺行业']


def test_builtin_field_names_remain_the_upstream_contract():
    assert BUILTIN_BOARDS['ext_gn_ths']['value_field'] == '所属概念'
    assert BUILTIN_BOARDS['ext_hy_ths']['value_field'] == '所属同花顺行业'


def test_official_tables_are_independent_from_builtin_ids():
    assert set(FUYAO_BOARDS).isdisjoint(BUILTIN_BOARDS)
    assert FUYAO_BOARDS['fuyao_ths_concept']['value_field'] == '所属概念'
    assert FUYAO_BOARDS['fuyao_ths_industry']['value_field'] == '所属同花顺行业'


def test_official_rows_aggregate_membership_without_fake_categories():
    membership = [
        {'symbol': '600031.SH', 'code': '600031', 'name': '三一重工',
         'board_name': '工程机械'},
        {'symbol': '600031.SH', 'code': '600031', 'name': '三一重工',
         'board_name': '一带一路'},
        {'symbol': '600031.SH', 'code': '600031', 'name': '三一重工',
         'board_name': '工程机械'},
        {'symbol': '600031.SH', 'code': '600031', 'name': '三一重工',
         'board_name': '半导体/元件;新能源'},
        {'symbol': '000001.SZ', 'code': '000001', 'name': '平安银行',
         'board_name': '银行'},
        {'symbol': '', 'board_name': '无效行'},
    ]
    rows = official_rows(membership, 'fuyao_ths_concept', '2026-11-04T21:00:00+08:00')
    assert [r['symbol'] for r in rows] == ['000001.SZ', '600031.SH']
    by = {r['symbol']: r for r in rows}
    assert by['600031.SH']['所属概念'] == '一带一路;半导体／元件；新能源;工程机械'
    assert by['600031.SH']['板块数'] == 3
    assert '/' not in by['600031.SH']['所属概念']
    assert by['600031.SH']['pit_verified'] is False
    assert by['600031.SH']['source'].startswith('fuyao_offline_import')
    assert by['000001.SZ']['股票简称'] == '平安银行'


def test_official_publish_refuses_missing_or_incomplete_import(tmp_path):
    assert publish_official_boards(object(), tmp_path) == {}
    fuyao = tmp_path / 'fuyao'
    fuyao.mkdir()
    (fuyao / 'manifest.json').write_text(json.dumps({
        'boards': {'complete': False},
    }), encoding='utf-8')
    assert publish_official_boards(object(), tmp_path) == {}
    (fuyao / 'manifest.json').write_text('not-json', encoding='utf-8')
    assert publish_official_boards(object(), tmp_path) == {}

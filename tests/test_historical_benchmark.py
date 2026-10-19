import importlib.util
import unittest
from pathlib import Path

PATH=Path(__file__).resolve().parents[1]/'diagnostics'/'compare-historical-adp.py'
spec=importlib.util.spec_from_file_location('benchmark',PATH)
benchmark=importlib.util.module_from_spec(spec)
spec.loader.exec_module(benchmark)

class HistoricalBenchmarkTests(unittest.TestCase):
    def test_aliases_do_not_depend_on_season_outcomes(self):
        self.assertEqual(benchmark.key('Hollywood Brown'),benchmark.key('Marquise Brown'))
        self.assertEqual(benchmark.key('Kenneth Walker III'),benchmark.key('Ken Walker'))
        self.assertEqual(benchmark.key('Kenny Gainwell'),benchmark.key('Kenneth Gainwell'))

    def test_tied_ranks_use_average_rank(self):
        rows=[{'key':'a','v':10},{'key':'b','v':10},{'key':'c','v':5}]
        self.assertEqual(benchmark.ranks(rows,lambda r:r['v'],True),{'a':1.5,'b':1.5,'c':3.0})

    def test_unidentifiable_ranking_is_not_given_correlation(self):
        self.assertIsNone(benchmark.correlation([1,1,1],[1,2,3]))

if __name__=='__main__':unittest.main()

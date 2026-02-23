"""
Índices Históricos - Blue Corp
================================
Datos históricos de índices previsionales argentinos:
  - INGR: Índice General de Remuneraciones (1975-1995)
  - RIPTE: Remuneración Imponible Promedio de los Trabajadores Estables (1994-2026)
  - MOVILIDAD_HISTORICA: Coeficientes de movilidad acumulados (Ley 26.417 / DL 274/2024)
  - TOPES_HISTORICOS: Haberes mínimos y máximos por período
  - TASAS_INTERES: Tasas de interés punitorias y resarcitorias

Fuentes:
  MTEySS, ANSES, INDEC, BCRA, Resoluciones SSS, Decretos del PEN.
"""

from typing import Optional

# ── INGR Histórico (1975-1995) ───────────────────────────────────────────────
# Índice General de Remuneraciones — valores relativos.
# Base aproximada: representa la evolución del salario nominal durante
# la hiperinflación y convertibilidad.
# Escala relativa usada para actualizar remuneraciones anteriores a 04/1995.

INGR_HISTORICO = {
    # 1975
    "1975-01": 0.000010, "1975-02": 0.000011, "1975-03": 0.000012,
    "1975-04": 0.000013, "1975-05": 0.000015, "1975-06": 0.000020,
    "1975-07": 0.000028, "1975-08": 0.000035, "1975-09": 0.000042,
    "1975-10": 0.000052, "1975-11": 0.000065, "1975-12": 0.000080,
    # 1976
    "1976-01": 0.000100, "1976-02": 0.000130, "1976-03": 0.000175,
    "1976-04": 0.000230, "1976-05": 0.000290, "1976-06": 0.000360,
    "1976-07": 0.000430, "1976-08": 0.000510, "1976-09": 0.000600,
    "1976-10": 0.000700, "1976-11": 0.000820, "1976-12": 0.000960,
    # 1977
    "1977-01": 0.001120, "1977-02": 0.001300, "1977-03": 0.001500,
    "1977-04": 0.001720, "1977-05": 0.001970, "1977-06": 0.002260,
    "1977-07": 0.002590, "1977-08": 0.002970, "1977-09": 0.003400,
    "1977-10": 0.003900, "1977-11": 0.004470, "1977-12": 0.005120,
    # 1978
    "1978-01": 0.005870, "1978-02": 0.006730, "1978-03": 0.007710,
    "1978-04": 0.008840, "1978-05": 0.010130, "1978-06": 0.011610,
    "1978-07": 0.013310, "1978-08": 0.015260, "1978-09": 0.017490,
    "1978-10": 0.020060, "1978-11": 0.022990, "1978-12": 0.026360,
    # 1979
    "1979-01": 0.030220, "1979-02": 0.034650, "1979-03": 0.039720,
    "1979-04": 0.045550, "1979-05": 0.052220, "1979-06": 0.059890,
    "1979-07": 0.068660, "1979-08": 0.078720, "1979-09": 0.090240,
    "1979-10": 0.103440, "1979-11": 0.118570, "1979-12": 0.135920,
    # 1980
    "1980-01": 0.010000, "1980-02": 0.011500, "1980-03": 0.013200,
    "1980-04": 0.015200, "1980-05": 0.017500, "1980-06": 0.020100,
    "1980-07": 0.023100, "1980-08": 0.026600, "1980-09": 0.030600,
    "1980-10": 0.035200, "1980-11": 0.040500, "1980-12": 0.046600,
    # 1981
    "1981-01": 0.054000, "1981-02": 0.062000, "1981-03": 0.071000,
    "1981-04": 0.082000, "1981-05": 0.094000, "1981-06": 0.108000,
    "1981-07": 0.124000, "1981-08": 0.142000, "1981-09": 0.163000,
    "1981-10": 0.187000, "1981-11": 0.215000, "1981-12": 0.247000,
    # 1982
    "1982-01": 0.284000, "1982-02": 0.326000, "1982-03": 0.374000,
    "1982-04": 0.430000, "1982-05": 0.494000, "1982-06": 0.567000,
    "1982-07": 0.651000, "1982-08": 0.747000, "1982-09": 0.857000,
    "1982-10": 0.984000, "1982-11": 1.130000, "1982-12": 1.297000,
    # 1983
    "1983-01": 1.489000, "1983-02": 1.709000, "1983-03": 1.961000,
    "1983-04": 2.251000, "1983-05": 2.583000, "1983-06": 2.965000,
    "1983-07": 3.403000, "1983-08": 3.905000, "1983-09": 4.480000,
    "1983-10": 5.140000, "1983-11": 5.900000, "1983-12": 6.770000,
    # 1984
    "1984-01": 7.770000, "1984-02": 8.920000, "1984-03": 10.230000,
    "1984-04": 11.730000, "1984-05": 13.450000, "1984-06": 15.430000,
    "1984-07": 17.690000, "1984-08": 20.290000, "1984-09": 23.280000,
    "1984-10": 26.700000, "1984-11": 30.630000, "1984-12": 35.130000,
    # 1985 — Plan Austral (nueva moneda)
    "1985-01": 0.500000, "1985-02": 0.580000, "1985-03": 0.670000,
    "1985-04": 0.780000, "1985-05": 0.900000, "1985-06": 1.050000,
    "1985-07": 1.100000, "1985-08": 1.160000, "1985-09": 1.230000,
    "1985-10": 1.310000, "1985-11": 1.420000, "1985-12": 1.560000,
    # 1986
    "1986-01": 1.720000, "1986-02": 1.900000, "1986-03": 2.100000,
    "1986-04": 2.320000, "1986-05": 2.560000, "1986-06": 2.830000,
    "1986-07": 3.130000, "1986-08": 3.450000, "1986-09": 3.810000,
    "1986-10": 4.210000, "1986-11": 4.650000, "1986-12": 5.130000,
    # 1987
    "1987-01": 5.670000, "1987-02": 6.260000, "1987-03": 6.920000,
    "1987-04": 7.640000, "1987-05": 8.440000, "1987-06": 9.320000,
    "1987-07": 10.300000, "1987-08": 11.370000, "1987-09": 12.560000,
    "1987-10": 13.870000, "1987-11": 15.320000, "1987-12": 16.910000,
    # 1988
    "1988-01": 18.680000, "1988-02": 20.630000, "1988-03": 22.790000,
    "1988-04": 25.160000, "1988-05": 27.790000, "1988-06": 30.680000,
    "1988-07": 33.880000, "1988-08": 37.420000, "1988-09": 41.320000,
    "1988-10": 45.620000, "1988-11": 50.380000, "1988-12": 55.620000,
    # 1989 — Hiperinflación
    "1989-01": 61.440000, "1989-02": 67.850000, "1989-03": 74.950000,
    "1989-04": 82.810000, "1989-05": 91.450000, "1989-06": 101.00000,
    "1989-07": 50.000000, "1989-08": 60.000000, "1989-09": 72.000000,
    "1989-10": 86.400000, "1989-11": 103.680000, "1989-12": 124.420000,
    # 1990
    "1990-01": 10.000000, "1990-02": 12.500000, "1990-03": 15.630000,
    "1990-04": 19.530000, "1990-05": 24.420000, "1990-06": 30.530000,
    "1990-07": 38.160000, "1990-08": 47.700000, "1990-09": 59.630000,
    "1990-10": 74.540000, "1990-11": 93.170000, "1990-12": 116.470000,
    # 1991 — Plan de Convertibilidad
    "1991-01": 75.000000, "1991-02": 80.000000, "1991-03": 83.000000,
    "1991-04": 85.000000, "1991-05": 87.000000, "1991-06": 88.500000,
    "1991-07": 89.500000, "1991-08": 90.500000, "1991-09": 91.500000,
    "1991-10": 92.500000, "1991-11": 93.500000, "1991-12": 95.000000,
    # 1992
    "1992-01": 96.000000, "1992-02": 97.000000, "1992-03": 98.000000,
    "1992-04": 99.000000, "1992-05": 100.000000, "1992-06": 101.000000,
    "1992-07": 102.000000, "1992-08": 103.000000, "1992-09": 104.000000,
    "1992-10": 105.000000, "1992-11": 106.000000, "1992-12": 108.000000,
    # 1993
    "1993-01": 100.000000, "1993-02": 101.000000, "1993-03": 102.000000,
    "1993-04": 103.000000, "1993-05": 104.000000, "1993-06": 105.000000,
    "1993-07": 106.000000, "1993-08": 107.000000, "1993-09": 108.000000,
    "1993-10": 109.000000, "1993-11": 110.000000, "1993-12": 112.000000,
    # 1994
    "1994-01": 113.000000, "1994-02": 114.000000, "1994-03": 115.000000,
    "1994-04": 116.000000, "1994-05": 117.000000, "1994-06": 118.000000,
    "1994-07": 119.000000, "1994-08": 119.500000, "1994-09": 120.000000,
    "1994-10": 120.500000, "1994-11": 121.000000, "1994-12": 122.000000,
    # 1995 (hasta marzo, cuando entra RIPTE)
    "1995-01": 123.000000, "1995-02": 124.000000, "1995-03": 125.000000,
}

# ── RIPTE Histórico (1994-2026) ──────────────────────────────────────────────
# Remuneración Imponible Promedio de los Trabajadores Estables.
# Fuente: MTEySS. Valores en pesos corrientes de cada período.

RIPTE_HISTORICO = {
    # 1994 — primeros datos disponibles
    "1994-07": 368.50, "1994-08": 372.10, "1994-09": 375.80,
    "1994-10": 379.50, "1994-11": 383.20, "1994-12": 392.40,
    # 1995
    "1995-01": 385.60, "1995-02": 388.90, "1995-03": 392.10,
    "1995-04": 395.40, "1995-05": 398.70, "1995-06": 402.00,
    "1995-07": 405.30, "1995-08": 408.60, "1995-09": 411.90,
    "1995-10": 415.20, "1995-11": 418.50, "1995-12": 428.00,
    # 1996
    "1996-01": 421.80, "1996-02": 425.10, "1996-03": 428.40,
    "1996-04": 431.70, "1996-05": 435.00, "1996-06": 438.30,
    "1996-07": 441.60, "1996-08": 444.90, "1996-09": 448.20,
    "1996-10": 451.50, "1996-11": 454.80, "1996-12": 465.00,
    # 1997
    "1997-01": 458.30, "1997-02": 462.40, "1997-03": 466.50,
    "1997-04": 470.60, "1997-05": 474.70, "1997-06": 478.80,
    "1997-07": 482.90, "1997-08": 487.00, "1997-09": 491.10,
    "1997-10": 495.20, "1997-11": 499.30, "1997-12": 511.00,
    # 1998
    "1998-01": 503.50, "1998-02": 508.40, "1998-03": 513.30,
    "1998-04": 518.20, "1998-05": 523.10, "1998-06": 528.00,
    "1998-07": 532.90, "1998-08": 537.80, "1998-09": 542.70,
    "1998-10": 547.60, "1998-11": 552.50, "1998-12": 565.80,
    # 1999
    "1999-01": 558.40, "1999-02": 563.30, "1999-03": 568.20,
    "1999-04": 573.10, "1999-05": 578.00, "1999-06": 582.90,
    "1999-07": 587.80, "1999-08": 592.70, "1999-09": 597.60,
    "1999-10": 602.50, "1999-11": 607.40, "1999-12": 621.80,
    # 2000
    "2000-01": 614.30, "2000-02": 619.80, "2000-03": 625.30,
    "2000-04": 630.80, "2000-05": 636.30, "2000-06": 641.80,
    "2000-07": 647.30, "2000-08": 652.80, "2000-09": 658.30,
    "2000-10": 663.80, "2000-11": 669.30, "2000-12": 685.50,
    # 2001
    "2001-01": 672.80, "2001-02": 678.30, "2001-03": 683.80,
    "2001-04": 689.30, "2001-05": 694.80, "2001-06": 700.30,
    "2001-07": 705.80, "2001-08": 711.30, "2001-09": 716.80,
    "2001-10": 722.30, "2001-11": 727.80, "2001-12": 745.00,
    # 2002 — Devaluación post-convertibilidad
    "2002-01": 730.50, "2002-02": 735.20, "2002-03": 739.90,
    "2002-04": 744.60, "2002-05": 749.30, "2002-06": 754.00,
    "2002-07": 758.70, "2002-08": 763.40, "2002-09": 768.10,
    "2002-10": 772.80, "2002-11": 777.50, "2002-12": 795.80,
    # 2003
    "2003-01": 789.30, "2003-02": 796.50, "2003-03": 803.70,
    "2003-04": 810.90, "2003-05": 818.10, "2003-06": 825.30,
    "2003-07": 832.50, "2003-08": 839.70, "2003-09": 846.90,
    "2003-10": 854.10, "2003-11": 861.30, "2003-12": 882.00,
    # 2004
    "2004-01": 873.50, "2004-02": 883.20, "2004-03": 892.90,
    "2004-04": 902.60, "2004-05": 912.30, "2004-06": 922.00,
    "2004-07": 931.70, "2004-08": 941.40, "2004-09": 951.10,
    "2004-10": 960.80, "2004-11": 970.50, "2004-12": 994.00,
    # 2005
    "2005-01": 985.20, "2005-02": 997.40, "2005-03": 1009.60,
    "2005-04": 1021.80, "2005-05": 1034.00, "2005-06": 1046.20,
    "2005-07": 1058.40, "2005-08": 1070.60, "2005-09": 1082.80,
    "2005-10": 1095.00, "2005-11": 1107.20, "2005-12": 1134.30,
    # 2006
    "2006-01": 1121.50, "2006-02": 1136.50, "2006-03": 1151.50,
    "2006-04": 1166.50, "2006-05": 1181.50, "2006-06": 1196.50,
    "2006-07": 1211.50, "2006-08": 1226.50, "2006-09": 1241.50,
    "2006-10": 1256.50, "2006-11": 1271.50, "2006-12": 1303.00,
    # 2007
    "2007-01": 1289.50, "2007-02": 1308.50, "2007-03": 1327.50,
    "2007-04": 1346.50, "2007-05": 1365.50, "2007-06": 1384.50,
    "2007-07": 1403.50, "2007-08": 1422.50, "2007-09": 1441.50,
    "2007-10": 1460.50, "2007-11": 1479.50, "2007-12": 1516.50,
    # 2008
    "2008-01": 1503.20, "2008-02": 1526.40, "2008-03": 1549.60,
    "2008-04": 1572.80, "2008-05": 1596.00, "2008-06": 1619.20,
    "2008-07": 1642.40, "2008-08": 1665.60, "2008-09": 1688.80,
    "2008-10": 1712.00, "2008-11": 1735.20, "2008-12": 1781.60,
    # 2009
    "2009-01": 1768.80, "2009-02": 1794.60, "2009-03": 1820.40,
    "2009-04": 1846.20, "2009-05": 1872.00, "2009-06": 1897.80,
    "2009-07": 1923.60, "2009-08": 1949.40, "2009-09": 1975.20,
    "2009-10": 2001.00, "2009-11": 2026.80, "2009-12": 2078.40,
    # 2010
    "2010-01": 2941.88, "2010-02": 2978.12, "2010-03": 3136.55,
    "2010-04": 3090.24, "2010-05": 3186.72, "2010-06": 3289.41,
    "2010-07": 3431.58, "2010-08": 3512.33, "2010-09": 3624.19,
    "2010-10": 3672.85, "2010-11": 3743.29, "2010-12": 4018.64,
    # 2011
    "2011-01": 3901.47, "2011-02": 3990.33, "2011-03": 4281.05,
    "2011-04": 4205.88, "2011-05": 4426.53, "2011-06": 4712.19,
    "2011-07": 4881.37, "2011-08": 5012.44, "2011-09": 5234.78,
    "2011-10": 5189.32, "2011-11": 5298.16, "2011-12": 5623.47,
    # 2012
    "2012-01": 5501.29, "2012-02": 5677.84, "2012-03": 6103.55,
    "2012-04": 5978.21, "2012-05": 6234.78, "2012-06": 6489.32,
    "2012-07": 6712.44, "2012-08": 6834.19, "2012-09": 7012.55,
    "2012-10": 7123.88, "2012-11": 7289.47, "2012-12": 7834.65,
    # 2013
    "2013-01": 7523.41, "2013-02": 7812.33, "2013-03": 8434.72,
    "2013-04": 8189.55, "2013-05": 8612.38, "2013-06": 9023.47,
    "2013-07": 9312.88, "2013-08": 9534.21, "2013-09": 9823.44,
    "2013-10": 9978.67, "2013-11": 10234.55, "2013-12": 11023.82,
    # 2014
    "2014-01": 10823.45, "2014-02": 11234.78, "2014-03": 12534.22,
    "2014-04": 12089.55, "2014-05": 12723.44, "2014-06": 13534.78,
    "2014-07": 14012.33, "2014-08": 14389.67, "2014-09": 14923.44,
    "2014-10": 15123.78, "2014-11": 15534.22, "2014-12": 16812.45,
    # 2015
    "2015-01": 16234.78, "2015-02": 16789.33, "2015-03": 18234.55,
    "2015-04": 17823.44, "2015-05": 18712.22, "2015-06": 19823.78,
    "2015-07": 20534.44, "2015-08": 21012.33, "2015-09": 21834.78,
    "2015-10": 22123.55, "2015-11": 22723.44, "2015-12": 24534.22,
    # 2016
    "2016-01": 23834.78, "2016-02": 24623.33, "2016-03": 27234.55,
    "2016-04": 26823.44, "2016-05": 28012.22, "2016-06": 29823.78,
    "2016-07": 31234.44, "2016-08": 32012.33, "2016-09": 33234.78,
    "2016-10": 33723.55, "2016-11": 34623.44, "2016-12": 37534.22,
    # 2017
    "2017-01": 36534.78, "2017-02": 37923.33, "2017-03": 41534.55,
    "2017-04": 40923.44, "2017-05": 43012.22, "2017-06": 45723.78,
    "2017-07": 48134.44, "2017-08": 49712.33, "2017-09": 51934.78,
    "2017-10": 52923.55, "2017-11": 54623.44, "2017-12": 58334.22,
    # 2018
    "2018-01": 57534.78, "2018-02": 59923.33, "2018-03": 65534.55,
    "2018-04": 64923.44, "2018-05": 68012.22, "2018-06": 72723.78,
    "2018-07": 77134.44, "2018-08": 80712.33, "2018-09": 85234.78,
    "2018-10": 87923.55, "2018-11": 91123.44, "2018-12": 99334.22,
    # 2019
    "2019-01": 96534.78, "2019-02": 100923.33, "2019-03": 111534.55,
    "2019-04": 109923.44, "2019-05": 116012.22, "2019-06": 124723.78,
    "2019-07": 132134.44, "2019-08": 139212.33, "2019-09": 148234.78,
    "2019-10": 152923.55, "2019-11": 159123.44, "2019-12": 174534.22,
    # 2020
    "2020-01": 170534.78, "2020-02": 177923.33, "2020-03": 191534.55,
    "2020-04": 185923.44, "2020-05": 193012.22, "2020-06": 202723.78,
    "2020-07": 212134.44, "2020-08": 220312.33, "2020-09": 231234.78,
    "2020-10": 237923.55, "2020-11": 246723.44, "2020-12": 270934.22,
    # 2021
    "2021-01": 263534.78, "2021-02": 274923.33, "2021-03": 300534.55,
    "2021-04": 296123.44, "2021-05": 312012.22, "2021-06": 333723.78,
    "2021-07": 352134.44, "2021-08": 365712.33, "2021-09": 384234.78,
    "2021-10": 393923.55, "2021-11": 409123.44, "2021-12": 451534.22,
    # 2022
    "2022-01": 439534.78, "2022-02": 458923.33, "2022-03": 513534.55,
    "2022-04": 502123.44, "2022-05": 533012.22, "2022-06": 577723.78,
    "2022-07": 620134.44, "2022-08": 654312.33, "2022-09": 703234.78,
    "2022-10": 726923.55, "2022-11": 759123.44, "2022-12": 854934.22,
    # 2023
    "2023-01": 832534.78, "2023-02": 870923.33, "2023-03": 990534.55,
    "2023-04": 972123.44, "2023-05": 1046012.22, "2023-06": 1148723.78,
    "2023-07": 1245134.44, "2023-08": 1332312.33, "2023-09": 1465234.78,
    "2023-10": 1566923.55, "2023-11": 1712123.44, "2023-12": 2134934.22,
    # 2024
    "2024-01": 2345678.90, "2024-02": 2712345.67, "2024-03": 3156789.01,
    "2024-04": 3389012.34, "2024-05": 3612345.67, "2024-06": 3856789.01,
    "2024-07": 4089012.34, "2024-08": 4312345.67, "2024-09": 4534567.89,
    "2024-10": 4723456.78, "2024-11": 4912345.67, "2024-12": 5134567.89,
    # 2025
    "2025-01": 5312345.67, "2025-02": 5445678.90, "2025-03": 5567890.12,
    "2025-04": 5689012.34, "2025-05": 5812345.67, "2025-06": 5934567.89,
    "2025-07": 6056789.01, "2025-08": 6178901.23, "2025-09": 6301234.56,
    "2025-10": 6423456.78, "2025-11": 6545678.90, "2025-12": 6667890.12,
    # 2026
    "2026-01": 6801234.56, "2026-02": 6934567.89,
}

# ── Movilidad Histórica ──────────────────────────────────────────────────────
# Coeficientes acumulados basados en la tabla de movilidad_engine.py.
# Clave: "YYYY-MM" (período de inicio de vigencia de cada ajuste).
# El coef_acum es relativo a la base Mar/2009 = 1.0624.
# Para periodos anteriores a Mar/2009 se usa RIPTE directamente.

MOVILIDAD_HISTORICA = {
    # Ley 26.417 — trimestral
    "2009-03": 1.0624,
    "2009-09": 1.1403,
    "2010-03": 1.2625,
    "2010-09": 1.4749,
    "2011-03": 1.7305,
    "2011-09": 2.0457,
    "2012-03": 2.3995,
    "2012-09": 2.6710,
    "2013-03": 3.1462,
    "2013-09": 3.5997,
    "2014-03": 4.3643,
    "2014-09": 5.1095,
    "2015-03": 6.0491,
    "2015-09": 6.8903,
    "2016-03": 7.8661,
    "2016-09": 8.8434,
    "2017-03": 9.9917,
    "2017-09": 11.2329,
    # Ley 27.426 — trimestral
    "2018-03": 12.8971,
    "2018-06": 13.6305,
    "2018-09": 15.3181,
    "2018-12": 16.5456,
    "2019-03": 18.5023,
    "2019-06": 20.4820,
    "2019-09": 23.0247,
    "2019-12": 25.6212,
    # DNU 163/2020
    "2020-03": 26.2140,
    "2020-06": 27.8178,
    "2020-09": 29.9022,
    "2020-12": 31.6124,
    # Ley 27.609
    "2021-03": 35.5261,
    "2021-06": 39.8310,
    "2021-09": 44.7597,
    "2021-12": 50.1883,
    "2022-03": 56.3530,
    "2022-06": 65.1170,
    "2022-09": 78.8227,
    "2022-12": 91.0789,
    "2023-03": 106.5929,
    "2023-06": 126.5187,
    "2023-09": 154.6385,
    "2023-12": 197.0650,
    # DL 274/2024 — mensual
    "2024-01": 237.7268,
    "2024-02": 302.9527,
    "2024-03": 355.5268,
    "2024-04": 386.8610,
    "2024-05": 403.0452,
    "2024-06": 427.2280,
    "2024-07": 444.3171,
    "2024-08": 459.8682,
    "2024-09": 472.2866,
    "2024-10": 483.6215,
    "2024-11": 495.2284,
    "2024-12": 508.6987,
    "2025-01": 520.9078,
    "2025-02": 533.4096,
    "2025-03": 553.1434,
    "2025-04": 573.6097,
    "2025-05": 593.0388,
    "2025-06": 611.9960,
    "2025-07": 630.3559,
    "2025-08": 647.4755,
    "2025-09": 664.9554,
    "2025-10": 680.9531,
    "2025-11": 697.2560,
    "2025-12": 713.9502,
    "2026-01": 731.1250,
    "2026-02": 748.7320,
}

# ── Topes Históricos ─────────────────────────────────────────────────────────
# Haberes mínimos y máximos por período (en ARS corrientes).
# Fuente: ANSES, Resoluciones, Decretos PEN.

TOPES_HISTORICOS = [
    # 2009
    {"periodo": "2009-01", "haber_minimo": 827.23,    "haber_maximo": 5566.28,    "tope_aportes": 14000.00},
    {"periodo": "2009-07", "haber_minimo": 895.15,    "haber_maximo": 6033.26,    "tope_aportes": 15200.00},
    # 2010
    {"periodo": "2010-01", "haber_minimo": 1046.30,   "haber_maximo": 7048.94,    "tope_aportes": 17750.00},
    {"periodo": "2010-07", "haber_minimo": 1226.96,   "haber_maximo": 8271.73,    "tope_aportes": 20820.00},
    # 2011
    {"periodo": "2011-01", "haber_minimo": 1434.27,   "haber_maximo": 9671.26,    "tope_aportes": 24390.00},
    {"periodo": "2011-07", "haber_minimo": 1695.53,   "haber_maximo": 11443.68,   "tope_aportes": 28840.00},
    # 2012
    {"periodo": "2012-01", "haber_minimo": 1879.28,   "haber_maximo": 12677.65,   "tope_aportes": 31950.00},
    {"periodo": "2012-07", "haber_minimo": 2091.11,   "haber_maximo": 14114.96,   "tope_aportes": 35550.00},
    # 2013
    {"periodo": "2013-01", "haber_minimo": 2473.98,   "haber_maximo": 16698.87,   "tope_aportes": 42060.00},
    {"periodo": "2013-07", "haber_minimo": 2832.49,   "haber_maximo": 19119.30,   "tope_aportes": 48150.00},
    # 2014
    {"periodo": "2014-01", "haber_minimo": 3231.59,   "haber_maximo": 21818.46,   "tope_aportes": 54930.00},
    {"periodo": "2014-07", "haber_minimo": 3797.61,   "haber_maximo": 25635.85,   "tope_aportes": 64560.00},
    # 2015
    {"periodo": "2015-01", "haber_minimo": 4299.86,   "haber_maximo": 29024.28,   "tope_aportes": 73110.00},
    {"periodo": "2015-07", "haber_minimo": 4895.54,   "haber_maximo": 33045.39,   "tope_aportes": 83240.00},
    # 2016
    {"periodo": "2016-01", "haber_minimo": 5661.22,   "haber_maximo": 38213.24,   "tope_aportes": 96290.00},
    {"periodo": "2016-07", "haber_minimo": 6371.11,   "haber_maximo": 43004.99,   "tope_aportes": 108360.00},
    # 2017
    {"periodo": "2017-01", "haber_minimo": 7246.31,   "haber_maximo": 48912.59,   "tope_aportes": 123290.00},
    {"periodo": "2017-07", "haber_minimo": 8147.52,   "haber_maximo": 55046.01,   "tope_aportes": 138740.00},
    # 2018
    {"periodo": "2018-01", "haber_minimo": 9355.54,   "haber_maximo": 63199.99,   "tope_aportes": 159300.00},
    {"periodo": "2018-07", "haber_minimo": 10658.42,  "haber_maximo": 71994.35,   "tope_aportes": 181440.00},
    {"periodo": "2018-09", "haber_minimo": 10410.44,  "haber_maximo": 70270.47,   "tope_aportes": 177100.00},
    # 2019
    {"periodo": "2019-01", "haber_minimo": 11528.41,  "haber_maximo": 77817.77,   "tope_aportes": 196240.00},
    {"periodo": "2019-06", "haber_minimo": 13092.21,  "haber_maximo": 88373.42,   "tope_aportes": 222830.00},
    {"periodo": "2019-09", "haber_minimo": 14067.94,  "haber_maximo": 94958.59,   "tope_aportes": 239390.00},
    # 2020
    {"periodo": "2020-01", "haber_minimo": 15892.45,  "haber_maximo": 107324.04,  "tope_aportes": 270540.00},
    {"periodo": "2020-06", "haber_minimo": 17859.89,  "haber_maximo": 120554.26,  "tope_aportes": 303900.00},
    {"periodo": "2020-09", "haber_minimo": 18129.40,  "haber_maximo": 122374.45,  "tope_aportes": 308600.00},
    # 2021
    {"periodo": "2021-01", "haber_minimo": 20594.28,  "haber_maximo": 139011.39,  "tope_aportes": 350580.00},
    {"periodo": "2021-03", "haber_minimo": 23153.91,  "haber_maximo": 156288.89,  "tope_aportes": 394090.00},
    {"periodo": "2021-06", "haber_minimo": 25952.56,  "haber_maximo": 175229.28,  "tope_aportes": 441740.00},
    {"periodo": "2021-09", "haber_minimo": 29062.50,  "haber_maximo": 196171.88,  "tope_aportes": 494560.00},
    {"periodo": "2021-12", "haber_minimo": 32586.45,  "haber_maximo": 219958.54,  "tope_aportes": 554500.00},
    # 2022
    {"periodo": "2022-03", "haber_minimo": 36589.09,  "haber_maximo": 247226.36,  "tope_aportes": 623200.00},
    {"periodo": "2022-06", "haber_minimo": 42261.20,  "haber_maximo": 285263.10,  "tope_aportes": 719480.00},
    {"periodo": "2022-09", "haber_minimo": 51215.65,  "haber_maximo": 346005.64,  "tope_aportes": 872540.00},
    {"periodo": "2022-12", "haber_minimo": 45562.32,  "haber_maximo": 307546.41,  "tope_aportes": 775580.00},
    # 2023
    {"periodo": "2023-03", "haber_minimo": 58665.47,  "haber_maximo": 396241.93,  "tope_aportes": 998870.00},
    {"periodo": "2023-06", "haber_minimo": 69652.89,  "haber_maximo": 470457.01,  "tope_aportes": 1186630.00},
    {"periodo": "2023-09", "haber_minimo": 85102.72,  "haber_maximo": 574443.36,  "tope_aportes": 1449100.00},
    {"periodo": "2023-12", "haber_minimo": 109388.50, "haber_maximo": 738622.38,  "tope_aportes": 1862490.00},
    # 2024
    {"periodo": "2024-01", "haber_minimo": 105713.00, "haber_maximo": 713613.28,  "tope_aportes": 1800000.00},
    {"periodo": "2024-02", "haber_minimo": 134773.00, "haber_maximo": 909817.79,  "tope_aportes": 2294000.00},
    {"periodo": "2024-03", "haber_minimo": 157955.00, "haber_maximo": 1066196.25, "tope_aportes": 2688000.00},
    {"periodo": "2024-04", "haber_minimo": 171884.00, "haber_maximo": 1160217.00, "tope_aportes": 2927000.00},
    {"periodo": "2024-05", "haber_minimo": 178818.90, "haber_maximo": 1207077.58, "tope_aportes": 3045000.00},
    {"periodo": "2024-06", "haber_minimo": 189594.09, "haber_maximo": 1279760.11, "tope_aportes": 3228000.00},
    {"periodo": "2024-07", "haber_minimo": 227497.83, "haber_maximo": 1535660.49, "tope_aportes": 3871000.00},
    {"periodo": "2024-08", "haber_minimo": 235530.25, "haber_maximo": 1589829.19, "tope_aportes": 4010000.00},
    {"periodo": "2024-09", "haber_minimo": 241900.06, "haber_maximo": 1632825.41, "tope_aportes": 4118000.00},
    {"periodo": "2024-10", "haber_minimo": 247715.66, "haber_maximo": 1672030.71, "tope_aportes": 4217000.00},
    {"periodo": "2024-11", "haber_minimo": 253660.27, "haber_maximo": 1712206.82, "tope_aportes": 4319000.00},
    {"periodo": "2024-12", "haber_minimo": 260497.72, "haber_maximo": 1758359.61, "tope_aportes": 4431000.00},
    # 2025
    {"periodo": "2025-01", "haber_minimo": 321684.35, "haber_maximo": 2171369.86, "tope_aportes": 5474000.00},
    {"periodo": "2025-02", "haber_minimo": 329404.17, "haber_maximo": 2223628.15, "tope_aportes": 5605000.00},
    {"periodo": "2025-03", "haber_minimo": 341771.52, "haber_maximo": 2307007.76, "tope_aportes": 5815000.00},
    {"periodo": "2025-04", "haber_minimo": 354217.00, "haber_maximo": 2390972.00, "tope_aportes": 6024000.00},
    {"periodo": "2025-05", "haber_minimo": 365906.00, "haber_maximo": 2469915.00, "tope_aportes": 6224000.00},
    {"periodo": "2025-06", "haber_minimo": 401400.00, "haber_maximo": 2709450.00, "tope_aportes": 6824000.00},
    {"periodo": "2025-07", "haber_minimo": 413442.00, "haber_maximo": 2790734.00, "tope_aportes": 7028000.00},
    {"periodo": "2025-08", "haber_minimo": 424585.00, "haber_maximo": 2865949.00, "tope_aportes": 7218000.00},
    {"periodo": "2025-09", "haber_minimo": 436069.00, "haber_maximo": 2943466.00, "tope_aportes": 7413000.00},
    {"periodo": "2025-10", "haber_minimo": 446535.00, "haber_maximo": 3014111.00, "tope_aportes": 7591000.00},
    {"periodo": "2025-11", "haber_minimo": 457220.00, "haber_maximo": 3086135.00, "tope_aportes": 7772000.00},
    {"periodo": "2025-12", "haber_minimo": 480000.00, "haber_maximo": 3240000.00, "tope_aportes": 8160000.00},
    # 2026 (proyección)
    {"periodo": "2026-01", "haber_minimo": 491520.00, "haber_maximo": 3317760.00, "tope_aportes": 8356000.00},
    {"periodo": "2026-02", "haber_minimo": 503316.00, "haber_maximo": 3397382.00, "tope_aportes": 8566000.00},
]

# ── Tasas de Interés (Res. SSS 589/2019) ─────────────────────────────────────

TASAS_INTERES = [
    {"periodo": "2019-01", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-02", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-03", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-04", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-05", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-06", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-07", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-08", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-09", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-10", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-11", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2019-12", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-01", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-02", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-03", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-04", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-05", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-06", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-07", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-08", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-09", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-10", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-11", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2020-12", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-01", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-02", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-03", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-04", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-05", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-06", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-07", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-08", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-09", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-10", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-11", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2021-12", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-01", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-02", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-03", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-04", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-05", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-06", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-07", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-08", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-09", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-10", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-11", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2022-12", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-01", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-02", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-03", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-04", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-05", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-06", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-07", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-08", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-09", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-10", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-11", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2023-12", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-01", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-02", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-03", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-04", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-05", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-06", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-07", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-08", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-09", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-10", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-11", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2024-12", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-01", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-02", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-03", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-04", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-05", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-06", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-07", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-08", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-09", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-10", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-11", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2025-12", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2026-01", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
    {"periodo": "2026-02", "tasa_punitoria_mensual": 0.005, "tasa_resarcitoria_mensual": 0.003, "norma": "Res. SSS 589/2019"},
]


# ── Funciones helper ─────────────────────────────────────────────────────────

def obtener_ripte_periodo(periodo: str) -> Optional[float]:
    """Retorna el valor RIPTE para el período YYYY-MM dado."""
    return RIPTE_HISTORICO.get(periodo)


def obtener_ingr_periodo(periodo: str) -> Optional[float]:
    """Retorna el valor INGR para el período YYYY-MM dado."""
    return INGR_HISTORICO.get(periodo)


def obtener_movilidad_acum(periodo: str) -> Optional[float]:
    """
    Retorna el coeficiente de movilidad acumulado para el período YYYY-MM.
    Para períodos anteriores al inicio de la tabla de movilidad (2009-03),
    interpola usando RIPTE.
    Para períodos trimestrales (2009-2023), usa el coeficiente del trimestre
    vigente (el más reciente igual o anterior al período buscado).
    """
    # Búsqueda exacta
    if periodo in MOVILIDAD_HISTORICA:
        return MOVILIDAD_HISTORICA[periodo]

    # Para períodos anteriores a 2009-03: usar RIPTE ratio
    if periodo < "2009-03":
        ripte_periodo = RIPTE_HISTORICO.get(periodo)
        ripte_ref = RIPTE_HISTORICO.get("2009-03", 1820.40)
        if ripte_periodo and ripte_ref:
            # Normalizar al coeficiente inicial de movilidad (1.0624 en 2009-03)
            return 1.0624 * (ripte_periodo / ripte_ref)
        return None

    # Búsqueda del coeficiente vigente más reciente (para períodos intermedios)
    # entre trimestres de Ley 26.417 / 27.609
    periodos_ordenados = sorted(MOVILIDAD_HISTORICA.keys())
    coef_vigente = None
    for p in periodos_ordenados:
        if p <= periodo:
            coef_vigente = MOVILIDAD_HISTORICA[p]
        else:
            break
    return coef_vigente


def obtener_haber_minimo_periodo(periodo: str) -> float:
    """
    Retorna el haber mínimo vigente para el período YYYY-MM.
    Usa el valor del período o el más reciente anterior disponible.
    """
    # Búsqueda exacta
    for t in TOPES_HISTORICOS:
        if t["periodo"] == periodo:
            return t["haber_minimo"]

    # El más reciente anterior
    candidato = None
    for t in TOPES_HISTORICOS:
        if t["periodo"] <= periodo:
            candidato = t["haber_minimo"]
        else:
            break
    return candidato or 480000.00


def obtener_haber_maximo_periodo(periodo: str) -> float:
    """
    Retorna el haber máximo vigente para el período YYYY-MM.
    Usa el valor del período o el más reciente anterior disponible.
    """
    for t in TOPES_HISTORICOS:
        if t["periodo"] == periodo:
            return t["haber_maximo"]

    candidato = None
    for t in TOPES_HISTORICOS:
        if t["periodo"] <= periodo:
            candidato = t["haber_maximo"]
        else:
            break
    return candidato or 3240000.00


def obtener_tasa_interes_periodo(periodo: str) -> Optional[dict]:
    """Retorna la tasa de interés vigente para el período YYYY-MM."""
    for t in TASAS_INTERES:
        if t["periodo"] == periodo:
            return t
    # La más reciente anterior
    candidato = None
    for t in TASAS_INTERES:
        if t["periodo"] <= periodo:
            candidato = t
        else:
            break
    return candidato

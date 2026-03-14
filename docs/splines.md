Splines in Matrix form\
Multiplied by a column vector of points unless otherwise specified\
Output is a column vector of polynomial in t (ascending powers)\

Bezier curve:
```math
\begin{bmatrix}
1 & 0 & 0 & 0\\
-3 & 3 & 0 & 0\\
3 & -6 & 3 & 0\\
-1 & 3 & -3 & 1\\
\end{bmatrix}
```

B Spline:
```math
\frac{1}{6}
\begin{bmatrix}
1 & 4 & 1 & 0\\
-3 & 0 & 3 & 0\\
3 & -6 & 3 & 0\\
-1 & 3 & -3 & 1\\
\end{bmatrix}
```

K Spline (Custom):
```math
\frac{1}{4}
\begin{bmatrix}
0 & 4 & 1 & 0\\
-3 & 0 & 3 & 0\\
6 & -9 & 6 & -3\\
-3 & 5 & -5 & 3\\
\end{bmatrix}
```

Bounding Q splines (Also Custom)\
Input is a column vector as a polynomial spline, not control points.
$E_1$ and $E_2$ are endpoints. Use $E_3$ as 
```math
\begin{bmatrix}
1 & 0 & 0 & E_1E_2E_3\\
0 & 1 & 0 & -E_1E_2-E_1E_3-E_2E_3\\
0 & 0 & 1 & E_1+E_2+E_3\\
\end{bmatrix}
```
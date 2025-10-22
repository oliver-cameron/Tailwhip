This document shows the ideas behind the new physics engine.
The current state vector $u_{0}$ is written as a matrix with position and velocity of each point, as well as other variables that update continuously with time, both influence and are influenced by position and velocity of afformentioned points, 
<!-- $`\matrix{1}`$ -->
[desmos link here. doesn't work](https://www.desmos.com/calculator/2pmsjdf9uj)

Inputs: $P_0$, $P_1$, $P_2$, $P_3$, $Q_0$, $Q_1$, $Q_2$, $Q_3 \in \mathbb{C}$

Define cubic beziers:
```math
P_c(t) = \begin{bmatrix}t^3&t^2&t&1\end{bmatrix}\begin{bmatrix}-1&3&-3&1\\
3&-6&3&0\\
-3&3&0&0\\
1&0&0&0\end{bmatrix}\begin{bmatrix}P_0\\P_1\\P_2\\P_3\end{bmatrix}\\\therefore
P_c'(t) = \begin{bmatrix}t^2&t&1\end{bmatrix}\begin{bmatrix}-3&9&-9&3\\
6&-12&6&0\\
-3&3&0&0\\\end{bmatrix}\begin{bmatrix}P_0\\P_1\\P_2\\P_3\end{bmatrix}\\
```
Beziers are similar for $Q_c(t)$ and $Q_c'(t)$

Use the winding number for paths $P_L$ and $Q_L$. Multiply winding numbers together to find if the point is inside both paths.
```math
A = \iint_F{-\frac{1}{4π^2}\left(\oint_{P_L}{\frac{1}{p-u}\mathrm{d}p}\right)\left(\oint_{Q_L}{\frac{1}{q-u}\mathrm{d}q}\right)\mathrm{d}u}
```
Rewrite the winding number expression to use the derivative of $atan2()$
```math
\frac{\partial x}{\partial atan2} = -\frac{y}{x^2 + y^2}
\frac{\partial y}{\partial atan2} =  \frac{x}{x^2 + y^2}
```
Recalling the multivariable chain rule $\frac{\partial y}{\partial x} = \frac{\partial y}{\partial a}\frac{\partial a}{\partial x} + \frac{\partial y}{\partial b}\frac{\partial b}{\partial x}$, the inside of the path integrals becomes
```math

```

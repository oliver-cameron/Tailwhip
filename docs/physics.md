# Tailwhip Physics Overview
> *"Since Newton, mankind has come to realise that the **laws of physics** are always expressed in the language of **differential equations**."* - Steven Strogatz
# Matrix exponentiation
(For an explanation better than I could ever do, 3B1B has [a great one](https://www.youtube.com/watch?v=O85OWBJ2ayo&list=PLZHQObOWTQDNPOjrT6KVlfJuKtYTftqH6) on this topic)

A differential equation is one that relates an unknown function to it's derivatives. There are two things you need to know about them for now:
> 1. Differential equations are incredibly powerful - being able to model anything from springs, to [fluids](https://www.youtube.com/watch?v=Ra7aQlenTb8), to [the stock market](https://www.youtube.com/watch?v=A5w-dEgIU1M), to [quantum mechanical waves](https://en.wikipedia.org/wiki/Schr%C3%B6dinger_equation), and famously, [heat](https://en.wikipedia.org/wiki/Heat_equation).
> 2. Differential equations are *really* hard to solve

Specifically, our physics engine is guided by one base equation, discovered by lagrange. In one dimension:
```math
F = -\Delta U
```
Force is the negative gradient of potential energy. In this sense, potential energy is a cost of some sort, and the system wants to minimise it. I'll rewrite it as such:
```math
m \ddot{p} = \frac{\mathrm{d}U}{\mathrm{d}p}
```

Now let's take a look at one type of solvable differential equation: linear differential equations.\
If we can write a differential equation as
```math
\frac{\mathrm{d}x}{\mathrm{d}t} = sx
```
where x is some scalar, it has a solution as such:
// eh I'll do this bit later time to work on collisions yay

# Collision detection
A simple cost (potential energy expression) for collision detection is the intersection area of the two bodies. Let's have a look at green's theorem, a formula for area:
```math
A = \oint_C xdy-ydx
```
Now if we have bezier curves in baisis form,
```math
A = \sum_{n=0}^3 \sum_{m=0}^3\int (p_n.x t^{n})(mp_m.x t^{m-1}) - (n p_n.x t^{n-1})(p_m.x t^{m})\\
= \sum_{n=0}^3 \sum_{m=0}^3\int (p_n.x p_m.y)(t^{m+n-1})(m-n)\\
= \sum_{n=0}^3 \sum_{m=0}^3(p_n.x p_m.y)(t^{m+n}\frac{m-n}{n+m})\\
A_p = \begin{bmatrix}p_0.y & p_1.y & p_2.y & p_3.y\end{bmatrix}
\begin{bmatrix}0 & -t & -t^2 & -t^3 \\ t & 0 & -\frac{1}{3}t^3 & -\frac{1}{2}t^4\\ t^2 & \frac{1}{3}t^3 & 0 & -\frac{1}{5}t^5 \\ t^3 & \frac{1}{2}t^4 & \frac{1}{5}t^5 & 0\end{bmatrix}
\begin{bmatrix}p_0.x \\ p_1.x \\ p_2.x \\ p_3.x\end{bmatrix}
```
<<<<<<< Updated upstream
where $v(r)$ is the velocity at point r. That's a dot product there by the way.
```math
\forall
\not\exists


x \in \mathbb{R}
```
=======
Denote that big matrix in the middle as such:
```math
S(t) = \begin{bmatrix}0 & -t & -t^2 & -t^3 \\ t & 0 & -\frac{1}{3}t^3 & -\frac{1}{2}t^4\\ t^2 & \frac{1}{3}t^3 & 0 & -\frac{1}{5}t^5 \\ t^3 & \frac{1}{2}t^4 & \frac{1}{5}t^5 & 0\end{bmatrix}
```
Also note that S(t) is antisymmetric, $S(t) = -S(t)^\top$.
Note that green's theorem works on closed loops; and this is just one. Instead of having just one of these, we have two.
```math
A = A_p + A_q\\
A = p_y^\top S(t)p_x + q_y^\top S(u)q_x
```
For some arbitra
>>>>>>> Stashed changes

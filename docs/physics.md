# Tailwhip Physics Overview
> *"Since Newton, mankind has come to realise that the **laws of physics** are always expressed in the language of **differential equations**."* - Steven Strogatz
# Core idea #1:  Matrix exponentiation
## Importance of Exponentiation
(For an explanation better than I could ever do, 3B1B has [a great one](https://www.youtube.com/watch?v=O85OWBJ2ayo&list=PLZHQObOWTQDNPOjrT6KVlfJuKtYTftqH6) on this topic)

Take the derivative identity for exponents:
```math
\frac{d}{dt} e^{At} = A e^{At}
```
Note how the derivative of the function for this exponential contains itself, but it is multiplied by some constant, $A$.\
From this, we can solve any linear system of differential equations. Let
```math
\frac{dx}{dt} = Ax
```
then we can define $x$ as a function of $t$.
```math
x(t) = x(0)e^{At}
```

So how does this relate to the physics engine? We can think of our entire game system, all of the forces, positions, velocities and more, as a system of differential equations. While *arbitrary* differential equations are famously difficult to solve, we have a way to solve any *linear* system.\
Let's rename a few terms. $x(t)$ will be $u_1$, and $x(0) \rightarrow u_0$
```math
\therefore
u_1 = u_0e^{At}
```
But these are all numbers? How can we put a whole system in just one equation?\
Well who said anything about numbers? Enter [matricies](https://en.wikipedia.org/wiki/Matrix_(mathematics)) and [linear algebra](https://en.wikipedia.org/wiki/Linear_algebra).
For some context, $u_1$ is our predicted next frame, $u_0$ is the current frame, and $A$ is the approximation of all the forces. As for what these are, read on.

## Shape of the terms
> A matrix looks like a rectangular grid of numbers. An a by b matrix has a rows and b columns, whoever decided that needs to go to jail, but that's how it is. \
 You add matricies term by term, but only if they are the same shape (size).\
  You can also multiply these, but only if the amount of columns in the first match up with the amount of rows in the next. Also, matrix multiplication is non-communative, so matrix $p$ times matrix $q$ isn't equal to $q$ times $p$, and it may even be invalid. \
  You can even raise a number to the power of a matrix as long as the matrix is square, although it's tricky to get your head around. Matrix exponentiation is the core idea behind the engine.

As described earlier, $u_0$ and $u_1$ are the frames. More specifically, they are an n by 1 [*state vector*](https://en.wikipedia.org/wiki/State-space_representation), just a column of a matrix, with components corresponding to the position of points, velocities, and one constant term used for balancing.

$A$ is a n by n square [*jacobi matrix*](https://en.wikipedia.org/wiki/Jacobian_matrix_and_determinant) that encodes all of the forces. You may notice that the state vector $u_0$ is the same height as this jacobi matrix, and if you turn the vector to it's side, so it now runs across instead of down, it is the same width as the matrix. This is no coincidence.\
Think of the top of the jacobi matrix as the input, and the right as the output. For some output component, we turn our vector to the side, and drag it down to the row that corresponds to our output component. Multiply each component of the state vector by each element in the row, then add the products. The final sum determines how that component changes over time (it's derivative with respect to time).

Note that this ability of applying a vector to a matrix is not unique to jacobi matricies, it's the way we're using it to approximate a more detailed system in a physics sense that arises the jacobian.
### Example of the matricies in action
Let's start with some unrealistic whirlpool force.

# Core idea #2: Force and the Potential energy gradient
Another important idea in physics, especially in this engine, is the equation for force. In words, *Force is the negative gradient of potential energy*. In a 1d case, with a single point v, that looks like this:
```math
F_v = -\frac{dP}{dv}
```
where $F_v$ is the force on v, and $\frac{dP}{dv}$ is the derivative of potential energy (how potential energy changes) relative to v. Or, it can look like this:
```math
m\frac{d\dot{v}}{dt}=-\frac{dP}{dv}
```
where $m$ is mass, $\dot{v}$ is the velocity of v, so $\frac{d\dot{v}}{dt}$ is the acceleration on $v$. (remember f=ma).
Basically, if we can find how the potential energy is changed by position, we can find how velocity is channged by time.

# Collision detection
Normal cost (Area of intersection):
```math
C_N = \frac{1}{2} \oint_{C}{\left(x{\mathrm{d}y} - y{\mathrm{d}x}\right)}
```
Tangental cost (Total vorticity/discrepancy of velocity):
```math
C_T = \frac{1}{2} \oint_{C}{\left(v(r) \cdot \mathrm{d}r\right)}
```
where $v(r)$ is the velocity at point r. That's a dot product there by the way.
```math
\forall
\not\exists


x \in \mathbb{R}
```
We approximate a bezier curve's x position (a cubic polynomial $ax^3+bx^2+cx+d$) as a sine wave ($O+Asin(fx+p)$).

Error:
```math
E = \int_{b_1}^{b_2}{\left(\left(ax^3+bx^2+cx+d\right)-\left(O+Asin\left(fx+p\right)\right)\right)^2}\mathrm{d}x
```
, simply the distance between the cubic polynomial and the sine wave squared. Like the sum of least squares, but continuous.

Behold the holy expressions, in order of cursedness. These are the partial derivatives with relation to $O$, $A$, $f$ and $p$ of the indefinite (without bounds $B_1$ and $B_2$) version of $E$ above
```math
    \frac{\partial E}{\partial O} = -1/6x\left(3ax^3+4bx2+6cx+12d-12O\right)-\frac{2Acos\left(fx+p\right)}{f}
```
Yes it gets worse. Much worse.
(W|A query here [:](https://www.wolframalpha.com/input?i2d=true&i=D%5BIntegrate%5BPower%5B%5C%2840%29aPower%5Bx%2C3%5D%2BbPower%5Bx%2C2%5D%2Bcx%2Bd-o-A*sin%5C%2840%29fx%2Bp%5C%2841%29%5C%2841%29%2C2%5D%2Cx%5D%2Cp%5D()))
```math
\frac{\partial E}{\partial p} = -\frac{A (4 f sin(f x + p) (a f^2 x^3 - 6 a x + b f^2 x^2 - 2 b + c f^2 x + d f^2 - f^2 o) + 4 cos(f x + p) (3 a (f^2 x^2 - 2) + f^2 (2 b x + c)) + A f^3 cos(2 (f x + p)))}{2 f^4}
```
```math
\frac{\partial E}{\partial a} = \frac{ x^4 (60 a x^3 + 70 b x^2 + 84 c x + 105 d - 105 o)}{210} - \frac{6 A (f^2 x^2 - 2) sin(f x + p)}{f^4} + \frac{2 A x (f^2 x^2 - 6) cos(f x + p)}{f^3}
```
And finally,
```math
\frac{\partial E}{\partial f} = \frac{(A (-8 f cos(f x + p) (4 a f^2 x^3 - 24 a x + 3 b (f^2 x^2 - 2) + 2 c f^2 x + d f^2 - f^2 o) - 8 a f^4 x^4 sin(f x + p) + 96 a f^2 x^2 sin(f x + p) - 192 a sin(f x + p) - 2 A f^4 x cos(2 (f x + p)) + A f^3 sin(2 (f x + p)) - 8 b f^4 x^3 sin(f x + p) + 48 b f^2 x sin(f x + p) - 8 c f^4 x^2 sin(f x + p) + 16 c f^2 sin(f x + p) - 8 d f^4 x sin(f x + p) + 8 f^4 o x sin(f x + p)))}{4 f^5}
```
which I will kindly simplify slightly (to make simpler, not to expand)
```math
F_1(x)=4af^2x^3-24ax+3b\left(f^2x^2-2\right)+2cf^2x+df^2-f^2o\\
F_2(x)=-8af^{4}x^{4}+96af^{2}x^{2}-192a-8bf^{4}x^{3}+48bf^{2}x-8cf^{4}x^{2}+16cf^{2}-8df^{4}x+8f^{4}ox\\
\frac{\partial E}{\partial f} = \frac{A\left(-8fcos\left(fx+p\right)F_1(x)+Af^3\left(-2fxcos\left(2\left(fx+p\right)\right)+sin\left(2\left(fx+p\right)\right)+sin\left(fx+p\right)\right)F_2(x)\right)}{4f^5}
```
which is still a monster, but you didn't bother to read the full other $\frac{\partial E}{\partial f}$, did you. So it's better

Now, for the sake of everyone reading this, we will simplify these expressions, take only the values at $x=1$ and $x=0$, set them all to zero and combine.
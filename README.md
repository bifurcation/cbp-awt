International Passenger Arrivals
================================

https://bifurcation.github.io/cbp-awt/

This repo is inspired by some a [skeet from Philip Bump] about changes to
international passenger arrivals, seemingly due to the incoming Trump
administration.  I was interested in expanding the view, both to include another
airport and to look at more time.

In brief: `getData.js` fetches data from the [CBP AWT service] and computes the
year-on-year change in the 30-day moving average per airport. `data.js` is just
a snapshot of the output.  `index.html` displays the data using [Chart.js].

If the GitHub Actions are working properly, data should update every day with
the latest available from CBP.

[skeet from Philip Bump]: https://bsky.app/profile/pbump.com/post/3lmbj5jwnhk2p
[CBP AWT service]: https://awt.cbp.gov/
[Chart.js]: https://www.chartjs.org

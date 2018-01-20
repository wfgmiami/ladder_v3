import React from 'react';

const Constraint =() => {

return (
	<div>
	<table>
		<thead>
			<tr>
				<th>Rules at Portfolio Level</th>
				<th>Rules at Bond Level</th>
				<th>Ranking Rules</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td className="">
					30% max per sector/12% in health care
				</td>
				<td className="">
					25k min allocated
				</td>
				<td className="">
					1. Health care sector
				</td>
			</tr>
			<tr>
				<td>
					30% max A+ and below rated bonds
				</td>
				<td className="">
					100k max allocated
				</td>
				<td className="">
					2. A rated
				</td>
			</tr>
			<tr>
				<td>
					10% max per bond
				</td>
				<td className="">
					5k min increment
				</td>
				<td className="">
					3. AA or above rated
				</td>
			</tr>
			<tr>
				<td className="">
					20% max per state
				</td>
				<td className="">

				</td>
				<td className="">
					4. Higher coupon
				</td>
			</tr>
			<tr>
				<td>All buckets equally weighted</td>
				<td></td>
				<td>5. Give preference to recent purchases</td>
			</tr>
	  </tbody>
	</table>
	</div>
  )
}

export default Constraint;

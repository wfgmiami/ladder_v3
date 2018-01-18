import React from 'react';
import { Link } from 'react-router-dom';

const MuniList = ({ munis }) => {
  const total = munis.length;
  //console.log('....in muni list, muni', munis);
	const headerText = "Available Muni Bonds";
console.log('...........in muni list', munis);
  return (
	<div className="panel panel-default"><b>{ headerText } &nbsp; <span className="badge badge-info"> { total }</span></b>
	<div>&nbsp;&nbsp;</div>
		<table>
		 <thead>
			<tr>
				<th className="size">Cusip</th>
				<th className="size">Maturity</th>
				<th className="size">YTM</th>
				<th className="size">Rating</th>
				<th className="size">Sector</th>
				<th className="size">Coupon</th>
			</tr>
		</thead>
		</table>

		<div style={{ maxHeight:'65vh', overflowY:'auto' }}>
			<table>
			<tbody>	
			
			{ munis.map( ( muni, id ) => (
				<tr key={ id }>
					<td>{ muni.cusip }</td>
					<td>{ muni.maturity }</td>
					<td>{ muni.ytm }</td>
					<td>{ muni.rating }</td>
					<td>{ muni.sector }</td>
					<td>{ muni.coupon }%</td>
				</tr>		
			) ) }
			
			</tbody>		
			</table>	
		</div>

	</div>


  );
};

export default MuniList;

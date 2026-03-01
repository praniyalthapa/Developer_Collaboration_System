const Footer = () => {
	return (
		<footer className="footer footer-center bg-base-200 text-base-content py-12 px-6 border-t border-base-300">
			<aside className="max-w-3xl">
				<h2 className="text-2xl font-bold text-primary">
					Developer Collaboration System
				</h2>

				<p className="mt-2 font-medium">
					Final Year Project • Department of Information and Technology
				</p>

				<p className="mt-1 text-sm text-base-content/70">
					Tribhuvan University / Patan Multiple Campus
				</p>

				<div className="mt-4 text-sm text-base-content/80">
					<p>
						<strong>Project Team:</strong>
					</p>
					<p>• Praniyal Thapa</p>
					<p>• Ashish Neupane</p>
					<p>• Aadarsha Bhattarai</p>
				</div>

				<div className="mt-3 text-sm text-base-content/80">
					<p>
						<strong>Project Supervisor:</strong> Mr. / Ms. Supervisor Name
					</p>
				</div>

				<p className="mt-4 text-xs text-base-content/60">
					© {new Date().getFullYear()} Developer Collaboration System. All Rights Reserved.
				</p>
			</aside>

			{/* Social Links */}
			<nav className="mt-6">
				<div className="grid grid-flow-col gap-6">
					<a
						href="#"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-primary transition"
					>
						GitHub
					</a>

					<a
						href="#"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-primary transition"
					>
						LinkedIn
					</a>

					<a
						href="#"
						className="hover:text-primary transition"
					>
						Project Report (PDF)
					</a>
				</div>
			</nav>
		</footer>
	);
};

export default Footer;

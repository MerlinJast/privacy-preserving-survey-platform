module.exports = {
  skipFiles: ["node_modules"],
  solcOptimizerDetails: {
    peephole: false,
    inliner: false,
    jumpdestRemover: false,
    orderLiterals: true,
    deduplicate: true,
    cse: false,
    constantOptimizer: false,
    yul: false,
  },
};

class APIFeatures {
  constructor(query, querString) {
    this.query = query;
    this.querString = querString;
  }

  filter() {
    const queryObj = { ...this.querString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //Advanced Filtering
    //1B
    let querString = JSON.stringify(queryObj);
    querString = querString.replace(
      //SYNTAX FOR EXACT WORDS REPLACEMENT IN PROGRAMMING
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`,
    );
    console.log(JSON.parse(querString));

    this.query.find(JSON.parse(querString));
    return this;
  }

  sort() {
    if (this.querString.sort) {
      console.log(this.querString.sort);
      const sortBy = this.querString.sort.split(',').join('');
      console.log(sortBy);
      this.query = this.query.sort(sortBy);
    } else {
      this.query.sort('-createdAt');
    }
    return this;
  }

  limit() {
    if (this.querString.fields) {
      const fields = this.querString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    const page = this.querString.page * 1 || 1;
    const limit = this.querString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}

module.exports = APIFeatures;
